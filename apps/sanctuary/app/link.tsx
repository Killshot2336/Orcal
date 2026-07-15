import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import type { LinkNotificationType } from '@sanctuary/shared';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';
import { callSendLink } from '../src/services/firebase';

const TYPES: { id: LinkNotificationType; label: string; emoji?: string }[] = [
  { id: 'haptic_whisper', label: 'Haptic Whisper' },
  { id: 'emoji_touch', label: 'Emoji Touch', emoji: '🕯️' },
  { id: 'heartbeat_presence', label: 'Heartbeat Presence' },
];

/**
 * Phase 3 — The Link ("I'm Thinking of You")
 * Customizable pulses with home-widget-ready payloads.
 */
export default function LinkScreen() {
  const bondId = useSanctuaryStore((s) => s.bondId);
  const setLink = useSanctuaryStore((s) => s.setLink);
  const lastLinkType = useSanctuaryStore((s) => s.lastLinkType);
  const setHeartbeat = useSanctuaryStore((s) => s.setHeartbeat);
  const heartbeatScore = useSanctuaryStore((s) => s.heartbeatScore);
  const [sent, setSent] = useState(0);
  const [note, setNote] = useState('Tap to send a private pulse');
  const bloom = useSharedValue(0);

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value,
    transform: [{ scale: 0.85 + bloom.value * 0.3 }],
  }));

  async function send(type: LinkNotificationType, emoji?: string) {
    setLink(type);
    setSent((n) => n + 1);
    setHeartbeat(Math.min(100, heartbeatScore + 1));
    bloom.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(0, { duration: 600 }),
    );

    if (type === 'haptic_whisper') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'heartbeat_presence') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.selectionAsync();
    }

    if (bondId) {
      try {
        await callSendLink({
          bondId,
          type,
          emoji,
          signature: `local-${Date.now()}`,
        });
        setNote(`Delivered ${type.replaceAll('_', ' ')}`);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'queued offline';
        setNote(`Pulse held · ${message}`);
      }
    } else {
      setNote(`Local pulse · ${type}`);
    }
  }

  async function stressBurst() {
    setNote('Stress: 100 Link pulses…');
    for (let i = 0; i < 100; i += 1) {
      await send(TYPES[i % TYPES.length]!.id, '🕯️');
    }
    setNote('Stress complete — rate limits should soft-reject excess on server');
  }

  return (
    <View style={styles.root}>
      <SacredBackground />
      <Animated.View style={[styles.bloom, bloomStyle]} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">The Link</SanctuaryText>
        <SanctuaryText variant="caption">I’m Thinking of You · sent {sent}</SanctuaryText>
      </View>

      <View style={styles.list}>
        {TYPES.map((t) => (
          <Pressable key={t.id} style={styles.card} onPress={() => void send(t.id, t.emoji)}>
            <SanctuaryText style={styles.cardTitle}>{t.label}</SanctuaryText>
            <SanctuaryText variant="caption">
              Widget-ready · {t.emoji ?? 'private haptic channel'}
            </SanctuaryText>
          </Pressable>
        ))}
      </View>

      <SanctuaryText variant="body" style={styles.note}>
        {note}
        {lastLinkType ? `\nLast: ${lastLinkType}` : ''}
      </SanctuaryText>

      <Pressable style={styles.stress} onPress={() => void stressBurst()}>
        <SanctuaryText style={styles.stressText}>Stress: 100 pulses / min</SanctuaryText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bloom: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.glow,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: space.lg,
    gap: 6,
  },
  list: {
    padding: space.lg,
    gap: 12,
  },
  card: {
    padding: space.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(230,196,138,0.25)',
    backgroundColor: 'rgba(42,56,51,0.55)',
    gap: 4,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.gold,
  },
  note: {
    paddingHorizontal: space.lg,
    color: colors.inkMuted,
  },
  stress: {
    margin: space.lg,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(196,120,106,0.2)',
    alignSelf: 'flex-start',
  },
  stressText: { color: colors.rose },
});
