import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const KIND_COLOR = {
  photo: colors.threadPhoto,
  voice: colors.threadVoice,
  screenshot: colors.threadShot,
  video: colors.threadVideo,
} as const;

/**
 * Phase 2 — Memory Box: The Loom
 * Interactive tapestry; each memory is a glowing thread in an evolving weave.
 */
export default function LoomScreen() {
  const memories = useSanctuaryStore((s) => s.memories);
  const addMemory = useSanctuaryStore((s) => s.addMemory);
  const weave = useSharedValue(0);
  const [status, setStatus] = useState('Touch a thread type to weave');

  const nodes = useMemo(() => {
    if (!memories.length) {
      return Array.from({ length: 6 }).map((_, i) => ({
        id: `ghost-${i}`,
        x: 40 + (i % 3) * 100,
        y: 50 + Math.floor(i / 3) * 110,
        color: 'rgba(185,169,146,0.25)',
        kind: 'photo' as const,
      }));
    }
    return memories.map((m) => ({
      id: m.id,
      x: 36 + m.loomX * 260,
      y: 40 + m.loomY * 240,
      color: KIND_COLOR[m.kind],
      kind: m.kind,
    }));
  }, [memories]);

  const animatedProps = useAnimatedProps(() => ({
    strokeOpacity: 0.25 + weave.value * 0.55,
  }));

  function weaveThread(kind: keyof typeof KIND_COLOR, sizeBytes = 240_000) {
    const id = `mem-${Date.now()}-${kind}`;
    addMemory({
      id,
      kind,
      caption: `${kind} thread`,
      hue: Math.random() * 360,
      loomX: Math.random(),
      loomY: Math.random(),
      createdAt: Date.now(),
      sizeBytes,
    });
    weave.value = 0;
    weave.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    setStatus(
      sizeBytes > 40_000_000
        ? `Wove large ${kind} (${Math.round(sizeBytes / 1e6)}MB) — fortress accepted`
        : `Wove a ${kind} into the tapestry`,
    );
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.8} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">The Loom</SanctuaryText>
        <SanctuaryText variant="caption">{status}</SanctuaryText>
      </View>

      <View style={styles.canvas}>
        <Svg width="100%" height="100%" viewBox="0 0 340 320">
          {nodes.map((a, i) =>
            nodes.slice(i + 1).map((b) => (
              <AnimatedPath
                key={`${a.id}-${b.id}`}
                d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 30} ${b.x} ${b.y}`}
                stroke={a.color}
                strokeWidth={1.4}
                fill="none"
                animatedProps={animatedProps}
              />
            )),
          )}
          {nodes.map((n) => (
            <Circle key={n.id} cx={n.x} cy={n.y} r={8} fill={n.color} />
          ))}
          {/* Warp / weft ghost lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Line
              key={`w-${i}`}
              x1={20}
              y1={40 + i * 55}
              x2={320}
              y2={40 + i * 55}
              stroke="rgba(230,196,138,0.08)"
              strokeWidth={1}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.actions}>
        {(['photo', 'voice', 'screenshot', 'video'] as const).map((kind) => (
          <Pressable
            key={kind}
            style={[styles.chip, { borderColor: KIND_COLOR[kind] }]}
            onPress={() => weaveThread(kind)}
          >
            <SanctuaryText style={{ color: KIND_COLOR[kind] }}>{kind}</SanctuaryText>
          </Pressable>
        ))}
        <Pressable
          style={styles.stress}
          onPress={() => weaveThread('video', 50 * 1024 * 1024)}
        >
          <SanctuaryText style={styles.stressText}>Stress: 50MB video thread</SanctuaryText>
        </Pressable>
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
  canvas: {
    margin: space.lg,
    height: 340,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,28,26,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(230,196,138,0.2)',
  },
  actions: {
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(42,56,51,0.55)',
  },
  stress: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(196,120,106,0.2)',
  },
  stressText: { color: colors.rose, fontFamily: fonts.body },
});
