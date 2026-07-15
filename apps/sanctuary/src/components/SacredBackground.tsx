import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/tokens';

/** Living dusk field — layered gradients + breathing luminous orbs. */
export function SacredBackground({ intensity = 1 }: { intensity?: number }) {
  const breath = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    drift.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breath, drift]);

  const orbA = useAnimatedStyle(() => ({
    opacity: 0.18 + breath.value * 0.14 * intensity,
    transform: [
      { translateX: drift.value * 24 },
      { translateY: breath.value * -18 },
      { scale: 1 + breath.value * 0.08 },
    ],
  }));

  const orbB = useAnimatedStyle(() => ({
    opacity: 0.12 + (1 - breath.value) * 0.12 * intensity,
    transform: [
      { translateX: (1 - drift.value) * -30 },
      { translateY: drift.value * 22 },
      { scale: 1.05 + (1 - breath.value) * 0.1 },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.bgDeep, colors.bgMid, '#24352E']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.orb, styles.orbAmber, orbA]} />
      <Animated.View style={[styles.orb, styles.orbRose, orbB]} />
      <LinearGradient
        colors={['transparent', 'rgba(20,28,26,0.55)']}
        style={styles.veil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orbAmber: {
    top: '12%',
    left: '-8%',
    backgroundColor: colors.amber,
  },
  orbRose: {
    bottom: '8%',
    right: '-10%',
    backgroundColor: colors.rose,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    top: '55%',
  },
});
