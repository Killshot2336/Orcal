import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { colors, fonts, space } from '../src/theme/tokens';
import { SACRED_PACT_TEXT } from '@sanctuary/shared';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import {
  ensurePinSalt,
  generateAndStoreCosmicKey,
  derivePinHash,
} from '../src/crypto/e2e';
import { callAcceptPact, ensureAnonymousSession } from '../src/services/firebase';

/**
 * Phase 1 — The Sacred Pact
 * Custom cinematic intro → shared vow → name + invite, then PIN gate.
 * No traditional username/password login.
 */
export default function OnboardingScreen() {
  const acceptPact = useSanctuaryStore((s) => s.acceptPact);
  const setPinSet = useSanctuaryStore((s) => s.setPinSet);
  const enableSimulationMode = useSanctuaryStore((s) => s.enableSimulationMode);

  const [phase, setPhase] = useState<'intro' | 'vow' | 'bond'>('intro');
  const [displayName, setDisplayName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [shimmer]);

  const titleGlow = useAnimatedStyle(() => ({
    opacity: 0.75 + shimmer.value * 0.25,
    transform: [{ scale: 1 + shimmer.value * 0.015 }],
  }));

  async function completePact() {
    if (!displayName.trim()) {
      setError('Offer your name to the pact.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      const salt = await ensurePinSalt();
      // PIN is set on next screen — store placeholder hash path via session.
      await derivePinHash('0000', salt);
      const fingerprint = await generateAndStoreCosmicKey();

      try {
        const result = await callAcceptPact({
          partnerDisplayName: displayName.trim(),
          pinSalt: salt,
          pinHash: 'pending-pin',
          inviteCode: inviteCode.trim() || undefined,
          keyFingerprint: fingerprint,
          vowText: SACRED_PACT_TEXT,
        });
        acceptPact({
          displayName: displayName.trim(),
          partnerName: partnerName.trim() || 'Beloved',
          bondId: result.bondId,
          role: result.role,
          inviteCode: result.inviteCode,
        });
      } catch {
        // Offline / demo fortress — local bond remains sacred.
        acceptPact({
          displayName: displayName.trim(),
          partnerName: partnerName.trim() || 'Beloved',
          bondId: `local-${Date.now().toString(36)}`,
          role: inviteCode ? 'B' : 'A',
          inviteCode: inviteCode || `SANC${Date.now().toString(36).slice(-6).toUpperCase()}`,
        });
      }
      setPinSet(false);
      router.replace('/pin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The pact could not settle.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={phase === 'intro' ? 1.2 : 0.85} />

      {phase === 'intro' && (
        <Animated.View entering={FadeIn.duration(900)} style={styles.intro}>
          {/* Full-bleed cinematic plane: SacredBackground is the dominant visual.
              Drop apps/sanctuary/assets/sacred-intro.mp4 and wire expo-av Video here for custom film. */}
          <View style={styles.introVeil} />
          <Animated.View style={titleGlow}>
            <SanctuaryText variant="brand">Sanctuary</SanctuaryText>
          </Animated.View>
          <SanctuaryText variant="body" style={styles.tagline}>
            A private sacred space for two. Encrypted in devotion.
          </SanctuaryText>
          <Pressable style={styles.cta} onPress={() => setPhase('vow')}>
            <SanctuaryText style={styles.ctaText}>Enter the Pact</SanctuaryText>
          </Pressable>
          <Pressable
            onPress={() => {
              enableSimulationMode();
              router.replace('/home');
            }}
            style={styles.ghost}
          >
            <SanctuaryText variant="caption">Open simulation chamber</SanctuaryText>
          </Pressable>
        </Animated.View>
      )}

      {phase === 'vow' && (
        <ScrollView contentContainerStyle={styles.vowPad}>
          <Animated.View entering={FadeInDown.duration(700)}>
            <SanctuaryText variant="title">The Sacred Pact</SanctuaryText>
            <SanctuaryText variant="plaque" style={styles.vow}>
              {SACRED_PACT_TEXT}
            </SanctuaryText>
            <Pressable style={styles.cta} onPress={() => setPhase('bond')}>
              <SanctuaryText style={styles.ctaText}>We Accept Together</SanctuaryText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}

      {phase === 'bond' && (
        <ScrollView contentContainerStyle={styles.vowPad} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(700)} style={styles.form}>
            <SanctuaryText variant="title">Name the Bond</SanctuaryText>
            <SanctuaryText variant="caption">
              No passwords. After this, you gate the Sanctuary with a shared PIN.
            </SanctuaryText>
            <Field label="Your name" value={displayName} onChangeText={setDisplayName} />
            <Field label="Partner’s name" value={partnerName} onChangeText={setPartnerName} />
            <Field
              label="Invite code (if joining)"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            {error ? <SanctuaryText style={styles.error}>{error}</SanctuaryText> : null}
            <Pressable style={[styles.cta, busy && styles.ctaBusy]} disabled={busy} onPress={completePact}>
              <SanctuaryText style={styles.ctaText}>
                {busy ? 'Sealing…' : 'Seal & Continue'}
              </SanctuaryText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  autoCapitalize?: 'characters' | 'words' | 'none';
}) {
  return (
    <View style={styles.field}>
      <SanctuaryText variant="caption">{label}</SanctuaryText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? 'words'}
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  intro: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  introVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,28,26,0.45)',
  },
  tagline: { maxWidth: 320, color: colors.inkMuted },
  cta: {
    marginTop: space.md,
    alignSelf: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.amber,
  },
  ctaBusy: { opacity: 0.6 },
  ctaText: {
    color: colors.bgDeep,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  ghost: { marginTop: space.sm, paddingVertical: 8 },
  vowPad: {
    paddingTop: 80,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  vow: { marginTop: space.lg, marginBottom: space.xl },
  form: { gap: space.md },
  field: { gap: 6 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,196,138,0.35)',
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 18,
    paddingVertical: 10,
  },
  error: { color: colors.danger, fontFamily: fonts.body },
});
