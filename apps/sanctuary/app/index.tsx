import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors } from '../src/theme/tokens';

export default function Gate() {
  const hydrated = useSanctuaryStore((s) => s.hydrated);
  const pactAccepted = useSanctuaryStore((s) => s.pactAccepted);
  const pinSet = useSanctuaryStore((s) => s.pinSet);
  const unlocked = useSanctuaryStore((s) => s.unlocked);

  useEffect(() => {
    if (!hydrated) return;
    if (!pactAccepted) {
      router.replace('/onboarding');
      return;
    }
    if (!pinSet || !unlocked) {
      router.replace('/pin');
      return;
    }
    router.replace('/home');
  }, [hydrated, pactAccepted, pinSet, unlocked]);

  return (
    <View style={styles.boot}>
      <ActivityIndicator color={colors.amber} />
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
