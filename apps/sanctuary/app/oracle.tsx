import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { ORACLE_TOPICS, offlineOracle, type OracleTopic } from '@sanctuary/shared';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';
import { callOracle } from '../src/services/firebase';

/**
 * Phase 2 — The Oracle's Chamber
 * Topic Wheel guides private AI questions.
 */
export default function OracleScreen() {
  const bondId = useSanctuaryStore((s) => s.bondId);
  const setOracle = useSanctuaryStore((s) => s.setOracle);
  const lastOracleQuestion = useSanctuaryStore((s) => s.lastOracleQuestion);
  const [topic, setTopic] = useState<OracleTopic>('deep_connection');
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [tone, setTone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rotation = useSharedValue(0);
  const reveal = useSharedValue(0);

  const topicMeta = useMemo(
    () => ORACLE_TOPICS.find((t) => t.id === topic)!,
    [topic],
  );

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  function selectTopic(next: OracleTopic, index: number) {
    setTopic(next);
    rotation.value = withSpring(index * 72, { damping: 16, stiffness: 120 });
  }

  async function askOracle() {
    setBusy(true);
    reveal.value = 0;
    try {
      const data = (await callOracle({
        bondId: bondId ?? 'local',
        topic,
        recentThemes: [],
      })) as { question: string; followUps?: string[]; tone?: string };

      setOracle(topic, data.question);
      setFollowUps(data.followUps ?? []);
      setTone(data.tone ?? null);
    } catch {
      // Local chamber — offline oracle bank mirrors Cloud Function.
      const data = offlineOracle({
        bondId: bondId ?? 'local',
        topic,
      });
      setOracle(topic, data.question);
      setFollowUps(data.followUps);
      setTone(data.tone);
    } finally {
      reveal.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.95} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">Oracle’s Chamber</SanctuaryText>
        <SanctuaryText variant="caption">
          Topic Wheel · {topicMeta.label}
        </SanctuaryText>
      </View>

      <View style={styles.wheelWrap}>
        <Animated.View style={[styles.wheel, wheelStyle]}>
          {ORACLE_TOPICS.map((t, i) => (
            <Pressable
              key={t.id}
              style={[
                styles.spoke,
                {
                  transform: [
                    { rotate: `${i * 72}deg` },
                    { translateY: -110 },
                  ],
                },
                topic === t.id && styles.spokeOn,
              ]}
              onPress={() => selectTopic(t.id, i)}
            >
              <SanctuaryText style={styles.spokeText}>{t.label}</SanctuaryText>
            </Pressable>
          ))}
        </Animated.View>
        <View style={styles.hub}>
          <SanctuaryText style={styles.hubText}>Ask</SanctuaryText>
        </View>
      </View>

      <Pressable style={styles.cta} disabled={busy} onPress={() => void askOracle()}>
        <SanctuaryText style={styles.ctaText}>
          {busy ? 'Listening…' : 'Consult the Oracle'}
        </SanctuaryText>
      </Pressable>

      <Animated.View style={[styles.answer, questionStyle]}>
        {tone ? (
          <SanctuaryText variant="caption">Tone · {tone}</SanctuaryText>
        ) : null}
        <SanctuaryText variant="plaque">
          {lastOracleQuestion ?? 'The chamber is quiet. Choose a topic and ask.'}
        </SanctuaryText>
        {followUps.map((f) => (
          <SanctuaryText key={f} variant="caption" style={styles.follow}>
            · {f}
          </SanctuaryText>
        ))}
      </Animated.View>
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
  wheelWrap: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  wheel: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(230,196,138,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spoke: {
    position: 'absolute',
    width: 120,
    alignItems: 'center',
  },
  spokeOn: {
    opacity: 1,
  },
  spokeText: {
    fontSize: 11,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  hub: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubText: {
    color: colors.bgDeep,
    fontFamily: fonts.bodyBold,
  },
  cta: {
    alignSelf: 'center',
    backgroundColor: colors.sage,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ctaText: { color: colors.bgDeep, fontFamily: fonts.bodyBold },
  answer: {
    margin: space.lg,
    padding: space.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(42,56,51,0.65)',
    gap: 10,
    minHeight: 140,
  },
  follow: { marginTop: 4 },
});
