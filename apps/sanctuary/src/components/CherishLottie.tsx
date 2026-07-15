import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

/**
 * Real-time Cherish bloom — Lottie when asset available, graceful no-op otherwise.
 * Place cherish-bloom.json in assets/lottie for production polish.
 */
export function CherishLottie({ active }: { active: boolean }) {
  if (!active) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const source = require('../../assets/lottie/cherish-bloom.json');
    return (
      <Animated.View exiting={FadeOut.duration(400)} style={styles.wrap} pointerEvents="none">
        <LottieView autoPlay loop={false} source={source} style={styles.lottie} />
      </Animated.View>
    );
  } catch {
    return <View style={styles.fallback} pointerEvents="none" />;
  }
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: { width: 280, height: 280 },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(230,196,138,0.12)',
  },
});
