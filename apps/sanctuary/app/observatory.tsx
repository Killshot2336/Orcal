import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, space } from '../src/theme/tokens';

/**
 * Phase 3 — The Observatory
 * Interactive star map / orrery from relationship metrics → constellations.
 */
export default function ObservatoryScreen() {
  const vows = useSanctuaryStore((s) => s.vows);
  const memories = useSanctuaryStore((s) => s.memories);
  const dreams = useSanctuaryStore((s) => s.dreams);
  const vault = useSanctuaryStore((s) => s.vault);
  const heartbeatScore = useSanctuaryStore((s) => s.heartbeatScore);
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const stars = useMemo(() => {
    const metrics = [
      { name: 'vows', n: vows.length, hue: colors.gold },
      { name: 'memories', n: memories.length, hue: colors.amber },
      { name: 'dreams', n: dreams.length, hue: colors.sage },
      { name: 'vault', n: vault.length, hue: colors.rose },
      { name: 'heartbeat', n: Math.round(heartbeatScore / 10), hue: colors.ink },
    ];
    return metrics.flatMap((m, mi) =>
      Array.from({ length: Math.max(1, Math.min(8, m.n || 1)) }).map((_, i) => {
        const angle = ((mi * 72 + i * 28) * Math.PI) / 180;
        const radius = 40 + i * 18 + mi * 6;
        return {
          id: `${m.name}-${i}`,
          x: 160 + Math.cos(angle) * radius,
          y: 160 + Math.sin(angle) * radius,
          r: 2 + (i % 3),
          color: m.hue,
          metric: m.name,
        };
      }),
    );
  }, [vows.length, memories.length, dreams.length, vault.length, heartbeatScore]);

  const links = useMemo(() => {
    const out: Array<[typeof stars[0], typeof stars[0]]> = [];
    for (let i = 0; i < stars.length - 1; i += 1) {
      if (i % 2 === 0) out.push([stars[i]!, stars[i + 1]!]);
    }
    return out;
  }, [stars]);

  const orreryStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <SacredBackground intensity={1} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">The Observatory</SanctuaryText>
        <SanctuaryText variant="caption">
          Constellations from lived devotion · heartbeat {heartbeatScore}
        </SanctuaryText>
      </View>

      <Animated.View style={[styles.map, orreryStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 320 320">
          <Circle cx={160} cy={160} r={120} stroke="rgba(230,196,138,0.15)" strokeWidth={1} fill="none" />
          <Circle cx={160} cy={160} r={70} stroke="rgba(127,159,138,0.2)" strokeWidth={1} fill="none" />
          {links.map(([a, b], i) => (
            <Line
              key={`l-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(212,165,116,0.35)"
              strokeWidth={1}
            />
          ))}
          {stars.map((s) => (
            <Circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill={s.color} />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.legend}>
        <SanctuaryText variant="body">
          Your sky holds {stars.length} stars across vows, memories, dreams, vault trust, and pulse.
        </SanctuaryText>
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
  map: {
    marginHorizontal: space.lg,
    marginTop: space.lg,
    height: 340,
    borderRadius: 170,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,28,26,0.5)',
  },
  legend: {
    padding: space.lg,
  },
});
