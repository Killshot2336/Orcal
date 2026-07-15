import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Extrapolation,
  FadeInRight,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space, vowTypeColor } from '../src/theme/tokens';
import type { VowType } from '@sanctuary/shared';
import { callCherish } from '../src/services/firebase';
import { encryptText } from '../src/crypto/e2e';

const TYPES: VowType[] = ['daily', 'sacred', 'desire'];

/**
 * Phase 2 — Vow Wall 2.0
 * Parallax hallway of glowing plaques + real-time Cherish pulse.
 */
export default function VowWallScreen() {
  const { width } = useWindowDimensions();
  const vows = useSanctuaryStore((s) => s.vows);
  const addVow = useSanctuaryStore((s) => s.addVow);
  const cherishVowLocal = useSanctuaryStore((s) => s.cherishVowLocal);
  const bondId = useSanctuaryStore((s) => s.bondId);
  const displayName = useSanctuaryStore((s) => s.displayName);
  const scrollX = useSharedValue(0);
  const cherishFlash = useSharedValue(0);

  const [draft, setDraft] = useState('');
  const [type, setType] = useState<VowType>('sacred');

  async function weaveVow() {
    if (!draft.trim()) return;
    const id = `vow-${Date.now()}`;
    addVow({
      id,
      type,
      text: draft.trim(),
      authorId: displayName || 'A',
      createdAt: Date.now(),
      cherishCount: 0,
    });
    try {
      await encryptText(draft.trim());
    } catch {
      /* local mode */
    }
    setDraft('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function cherish(id: string) {
    cherishVowLocal(id);
    cherishFlash.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 700 }),
    );
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (bondId) {
      try {
        await callCherish({ bondId, vowId: id });
      } catch {
        /* offline cherish still animates locally */
      }
    }
  }

  const flashStyle = useAnimatedStyle(() => ({
    opacity: cherishFlash.value * 0.55,
  }));

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.75} />
      <Animated.View style={[styles.cherishBloom, flashStyle]} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">Vow Wall</SanctuaryText>
        <SanctuaryText variant="caption">Hallway of glowing plaques</SanctuaryText>
      </View>

      <Animated.FlatList
        horizontal
        data={vows}
        keyExtractor={(v) => v.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.78}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: width * 0.11 }}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={[styles.empty, { width: width * 0.78 }]}>
            <SanctuaryText variant="plaque">
              The hallway waits for your first vow.
            </SanctuaryText>
          </View>
        }
        renderItem={({ item, index }) => (
          <VowPlaqueCard
            index={index}
            width={width}
            scrollX={scrollX}
            text={item.text}
            type={item.type}
            cherishCount={item.cherishCount}
            onCherish={() => void cherish(item.id)}
          />
        )}
      />

      <View style={styles.composer}>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeChip,
                type === t && { borderColor: vowTypeColor[t] },
              ]}
            >
              <SanctuaryText style={{ color: vowTypeColor[t], textTransform: 'capitalize' }}>
                {t}
              </SanctuaryText>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Speak a vow…"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.cta} onPress={() => void weaveVow()}>
          <SanctuaryText style={styles.ctaText}>Place Plaque</SanctuaryText>
        </Pressable>
      </View>
    </View>
  );
}

function VowPlaqueCard({
  index,
  width,
  scrollX,
  text,
  type,
  cherishCount,
  onCherish,
}: {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  text: string;
  type: VowType;
  cherishCount: number;
  onCherish: () => void;
}) {
  const cardW = width * 0.78;
  const style = useAnimatedStyle(() => {
    const input = [
      (index - 1) * cardW,
      index * cardW,
      (index + 1) * cardW,
    ];
    const scale = interpolate(scrollX.value, input, [0.9, 1, 0.9], Extrapolation.CLAMP);
    const rotateY = interpolate(scrollX.value, input, [18, 0, -18], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, input, [0.55, 1, 0.55], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 900 },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60)}
      style={[styles.plaque, { width: cardW, borderColor: vowTypeColor[type] }, style]}
    >
      <SanctuaryText variant="caption" style={{ color: vowTypeColor[type] }}>
        {type.toUpperCase()}
      </SanctuaryText>
      <SanctuaryText variant="plaque">{text}</SanctuaryText>
      <Pressable onPress={onCherish} style={styles.cherishBtn}>
        <SanctuaryText style={styles.cherishText}>Cherish · {cherishCount}</SanctuaryText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cherishBloom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gold,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: space.lg,
    gap: 6,
    marginBottom: space.md,
  },
  empty: {
    height: 280,
    justifyContent: 'center',
    padding: space.lg,
  },
  plaque: {
    height: 300,
    marginHorizontal: 6,
    padding: space.lg,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(42,56,51,0.72)',
    justifyContent: 'space-between',
  },
  composer: {
    padding: space.lg,
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,196,138,0.15)',
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(185,169,146,0.3)',
  },
  input: {
    minHeight: 64,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.amber,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaText: { color: colors.bgDeep, fontFamily: fonts.bodyBold },
  cherishBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(212,165,116,0.18)',
  },
  cherishText: { color: colors.gold, fontFamily: fonts.bodyBold },
});
