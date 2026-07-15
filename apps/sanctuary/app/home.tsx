import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SacredBackground } from '../src/components/SacredBackground';
import { HeartbeatWidget } from '../src/components/HeartbeatWidget';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, space } from '../src/theme/tokens';

const NAV = [
  { href: '/vow-wall', label: 'Vow Wall', hint: '← swipe' },
  { href: '/loom', label: 'The Loom', hint: '↑' },
  { href: '/oracle', label: 'Oracle', hint: '→ swipe' },
  { href: '/link', label: 'The Link', hint: '' },
  { href: '/vault', label: 'Vault', hint: '' },
  { href: '/observatory', label: 'Observatory', hint: '' },
  { href: '/dreams', label: 'Slumber', hint: '' },
  { href: '/temple', label: 'Temple', hint: '' },
] as const;

/**
 * Phase 1 — The Sanctuary home.
 * Dynamic background + Heartbeat + gesture edges to pillars.
 */
export default function HomeScreen() {
  const heartbeatScore = useSanctuaryStore((s) => s.heartbeatScore);
  const partnerName = useSanctuaryStore((s) => s.partnerName);
  const displayName = useSanctuaryStore((s) => s.displayName);
  const inviteCode = useSanctuaryStore((s) => s.inviteCode);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const go = (path: string) => router.push(path as never);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      offsetX.value = e.translationX * 0.15;
      offsetY.value = e.translationY * 0.15;
    })
    .onEnd((e) => {
      if (e.translationX < -80) runOnJS(go)('/oracle');
      else if (e.translationX > 80) runOnJS(go)('/vow-wall');
      else if (e.translationY < -80) runOnJS(go)('/loom');
      else if (e.translationY > 80) runOnJS(go)('/link');
      offsetX.value = withSpring(0);
      offsetY.value = withSpring(0);
    });

  const drift = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.9 + heartbeatScore / 250} />
      <GestureDetector gesture={pan}>
        <Animated.View entering={FadeIn.duration(700)} style={[styles.content, drift]}>
          <SanctuaryText variant="brand" style={styles.brand}>
            Sanctuary
          </SanctuaryText>
          <SanctuaryText variant="caption">
            {displayName} · {partnerName}
            {inviteCode ? ` · code ${inviteCode}` : ''}
          </SanctuaryText>

          <View style={styles.heart}>
            <HeartbeatWidget
              score={heartbeatScore}
              partnerName={partnerName || 'Beloved'}
              onPress={() => go('/observatory')}
            />
          </View>

          <View style={styles.nav}>
            {NAV.map((item) => (
              <Pressable key={item.href} style={styles.navItem} onPress={() => go(item.href)}>
                <SanctuaryText style={styles.navLabel}>{item.label}</SanctuaryText>
              </Pressable>
            ))}
          </View>

          <SanctuaryText variant="caption" style={styles.hint}>
            Swipe the chamber — left Vow Wall · right Oracle · up Loom · down Link
          </SanctuaryText>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
  brand: { fontSize: 44, marginBottom: 4 },
  heart: { marginTop: space.xl, marginBottom: space.xl },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 360,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230,196,138,0.28)',
    backgroundColor: 'rgba(42,56,51,0.45)',
  },
  navLabel: {
    color: colors.ink,
    fontSize: 14,
  },
  hint: {
    marginTop: space.xl,
    textAlign: 'center',
    maxWidth: 300,
  },
});
