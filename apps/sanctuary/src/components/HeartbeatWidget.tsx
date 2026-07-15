import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, fonts, space } from '../theme/tokens';

interface Props {
  score: number;
  partnerName: string;
  onPress?: () => void;
}

/** Central Heartbeat — pulse rate scales with relationship vitality. */
export function HeartbeatWidget({ score, partnerName, onPress }: Props) {
  const pulse = useSharedValue(1);
  const duration = Math.max(520, 1400 - score * 8);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: duration * 0.35, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: duration * 0.65, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [duration, pulse]);

  const beatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glow = Math.min(1, score / 100);

  return (
    <Pressable
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        onPress?.();
      }}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={`Heartbeat ${score}. Connected with ${partnerName}`}
    >
      <Animated.View style={[styles.orb, beatStyle, { shadowOpacity: 0.25 + glow * 0.45 }]}>
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Path
            d="M36 58s-18-11.5-24-22C7 27 10 16 19 14c6-1.4 11 2 14 7 3-5 8-8.4 14-7 9 2 12 13 7 22-6 10.5-24 22-24 22z"
            fill={colors.rose}
            opacity={0.9}
          />
        </Svg>
        <View style={styles.scorePill}>
          <Text style={styles.score}>{score}</Text>
        </View>
      </Animated.View>
      <Text style={styles.label}>Heartbeat</Text>
      <Text style={styles.sub}>woven with {partnerName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: space.sm,
  },
  orb: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(42,56,51,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,196,138,0.35)',
    shadowColor: colors.amber,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  scorePill: {
    position: 'absolute',
    bottom: 18,
  },
  score: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    letterSpacing: 1,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 1.2,
  },
  sub: {
    color: colors.inkMuted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
