import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Ellipse, Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BODY_REGIONS } from '@sanctuary/shared';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';
import { callOracle } from '../src/services/firebase';

/**
 * Phase 4 — The Body Map: The Temple
 * Artistic silhouette; region taps → Oracle questions for sacred physical exploration.
 */
export default function TempleScreen() {
  const bondId = useSanctuaryStore((s) => s.bondId);
  const setOracle = useSanctuaryStore((s) => s.setOracle);
  const [region, setRegion] = useState<string | null>(null);
  const [question, setQuestion] = useState(
    'Touch the Temple with reverence. Curiosity is invitation, never demand.',
  );
  const glow = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + glow.value * 0.5,
  }));

  async function touchRegion(id: string, label: string) {
    setRegion(label);
    glow.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(0.35, { duration: 700 }),
    );
    try {
      const data = (await callOracle({
        bondId: bondId ?? 'local',
        topic: 'naughty_exploration',
        bodyRegion: label.toLowerCase(),
      })) as { question: string };
      setQuestion(data.question);
      setOracle('naughty_exploration', data.question);
    } catch {
      setQuestion(
        `What kind of presence would honor the ${label.toLowerCase()} tonight — still, playful, or yearning?`,
      );
    }
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.7} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">The Temple</SanctuaryText>
        <SanctuaryText variant="caption">
          {region ? `Region · ${region}` : 'Artistic silhouette · consent-first'}
        </SanctuaryText>
      </View>

      <View style={styles.stage}>
        <Animated.View style={[styles.aura, glowStyle]} />
        <Svg width="220" height="420" viewBox="0 0 220 420">
          {/* Respectful abstract silhouette — not anatomical pornography */}
          <Ellipse cx={110} cy={48} rx={28} ry={34} fill="rgba(243,232,216,0.18)" />
          <Path
            d="M70 95 C70 80, 150 80, 150 95 L165 210 C168 250, 155 280, 145 300 L140 400 L80 400 L75 300 C65 280, 52 250, 55 210 Z"
            fill="rgba(243,232,216,0.12)"
            stroke="rgba(230,196,138,0.45)"
            strokeWidth={1.5}
          />
        </Svg>
        {BODY_REGIONS.map((r) => (
          <Pressable
            key={r.id}
            style={[
              styles.hotspot,
              {
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
              },
            ]}
            onPress={() => void touchRegion(r.id, r.label)}
            accessibilityLabel={`Temple region ${r.label}`}
          >
            <View style={styles.hotspotDot} />
          </Pressable>
        ))}
      </View>

      <View style={styles.oracle}>
        <SanctuaryText variant="plaque">{question}</SanctuaryText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingHorizontal: space.lg,
    gap: 6,
  },
  stage: {
    alignSelf: 'center',
    width: 240,
    height: 440,
    marginTop: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.rose,
  },
  hotspot: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    opacity: 0.85,
  },
  oracle: {
    margin: space.lg,
    padding: space.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(42,56,51,0.65)',
    minHeight: 100,
  },
});
