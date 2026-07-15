import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { colors, fonts, space } from '../src/theme/tokens';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { derivePinHash, ensurePinSalt } from '../src/crypto/e2e';

const PIN_HASH_KEY = 'sanctuary.pinHash';

/** Secure PIN gate — replaces traditional login after Sacred Pact. */
export default function PinScreen() {
  const pinSet = useSanctuaryStore((s) => s.pinSet);
  const setPinSet = useSanctuaryStore((s) => s.setPinSet);
  const setUnlocked = useSanctuaryStore((s) => s.setUnlocked);

  const [digits, setDigits] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mode = pinSet ? 'unlock' : confirm === null ? 'create' : 'confirm';

  const title = useMemo(() => {
    if (mode === 'create') return 'Create your Sanctuary PIN';
    if (mode === 'confirm') return 'Confirm the PIN';
    return 'Enter Sanctuary';
  }, [mode]);

  async function finishUnlock() {
    setUnlocked(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/home');
  }

  async function onDigit(d: string) {
    await Haptics.selectionAsync();
    const next = (digits + d).slice(0, 6);
    setDigits(next);
    setError(null);
    if (next.length < 4) return;

    // Accept 4–6 digit PINs when user taps Enter, or auto at 6.
    if (next.length === 6) {
      await submit(next);
    }
  }

  async function submit(pin: string) {
    const salt = await ensurePinSalt();
    const hash = await derivePinHash(pin, salt);

    if (mode === 'create') {
      setConfirm(pin);
      setDigits('');
      return;
    }

    if (mode === 'confirm') {
      if (pin !== confirm) {
        setError('The pins do not match. Breathe, try again.');
        setConfirm(null);
        setDigits('');
        return;
      }
      await AsyncStorage.setItem(PIN_HASH_KEY, hash);
      setPinSet(true);
      await finishUnlock();
      return;
    }

    const stored = await AsyncStorage.getItem(PIN_HASH_KEY);
    if (stored && stored !== hash) {
      setError('That pin does not open this door.');
      setDigits('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!stored) {
      await AsyncStorage.setItem(PIN_HASH_KEY, hash);
      setPinSet(true);
    }
    await finishUnlock();
  }

  async function biometric() {
    const ready = await LocalAuthentication.hasHardwareAsync();
    if (!ready) return;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Open Sanctuary',
      disableDeviceFallback: false,
    });
    if (result.success) await finishUnlock();
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.7} />
      <View style={styles.content}>
        <SanctuaryText variant="brand" style={styles.brand}>
          Sanctuary
        </SanctuaryText>
        <SanctuaryText variant="title">{title}</SanctuaryText>
        <View style={styles.dots}>
          {Array.from({ length: Math.max(4, digits.length || 4) }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < digits.length && styles.dotOn]}
            />
          ))}
        </View>
        {error ? <SanctuaryText style={styles.error}>{error}</SanctuaryText> : null}
        <View style={styles.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'ok'].map((key) => (
            <Pressable
              key={key}
              style={styles.key}
              onPress={() => {
                if (key === 'bio') {
                  void biometric();
                  return;
                }
                if (key === 'ok') {
                  if (digits.length >= 4) void submit(digits);
                  return;
                }
                void onDigit(key);
              }}
            >
              <SanctuaryText style={styles.keyText}>
                {key === 'bio' ? '◌' : key === 'ok' ? '→' : key}
              </SanctuaryText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: 96,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: space.md,
  },
  brand: { fontSize: 40, marginBottom: space.sm },
  dots: { flexDirection: 'row', gap: 12, marginVertical: space.lg },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.inkMuted,
  },
  dotOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  pad: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: space.lg,
  },
  key: {
    width: 84,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,56,51,0.75)',
  },
  keyText: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  error: { color: colors.danger },
});
