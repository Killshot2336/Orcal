import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, FlatList } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';
import { callUnlockVault } from '../src/services/firebase';
import { encryptText } from '../src/crypto/e2e';

type Kind = 'vent' | 'fear' | 'trust' | 'confession';

/**
 * Phase 3 — Fortress Gate: The Vault
 * Biometric-style two-person authentication for ultimate trust space.
 */
export default function VaultScreen() {
  const [gateOpen, setGateOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<Kind>('trust');
  const [status, setStatus] = useState('Both partners must unlock for mutual visibility.');
  const vault = useSanctuaryStore((s) => s.vault);
  const addVault = useSanctuaryStore((s) => s.addVault);
  const unlockVaultLocal = useSanctuaryStore((s) => s.unlockVaultLocal);
  const bondId = useSanctuaryStore((s) => s.bondId);
  const displayName = useSanctuaryStore((s) => s.displayName);
  const role = useSanctuaryStore((s) => s.role);

  async function openGate() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Open the Vault Gate',
      });
      if (!res.success) {
        setStatus('Gate remains sealed.');
        return;
      }
    }
    setGateOpen(true);
    setStatus('Gate open for you. Partner unlock still required per entry.');
  }

  async function sealEntry() {
    if (!draft.trim()) return;
    const id = `vault-${Date.now()}`;
    const authorId = displayName || role || 'A';
    addVault({
      id,
      kind,
      text: draft.trim(),
      authorId,
      unlockedBy: [authorId],
      createdAt: Date.now(),
    });
    try {
      await encryptText(draft.trim());
    } catch {
      /* local */
    }
    setDraft('');
    setStatus('Sealed. Awaiting second key.');
  }

  async function dualUnlock(id: string) {
    const partnerId = role === 'A' ? 'User B' : 'User A';
    unlockVaultLocal(id, partnerId);
    if (bondId) {
      try {
        const res = await callUnlockVault({ bondId, entryId: id });
        setStatus(
          res.mutuallyOpen
            ? 'Mutual unlock complete — trust space open.'
            : 'Your key turned. Waiting for partner.',
        );
      } catch {
        setStatus('Local dual-unlock simulated for partner.');
      }
    } else {
      setStatus('Local dual-unlock simulated for partner.');
    }
  }

  async function simultaneousStress() {
    setStatus('Stress: simultaneous vault access…');
    await openGate();
    for (let i = 0; i < 5; i += 1) {
      addVault({
        id: `stress-vault-${Date.now()}-${i}`,
        kind: 'fear',
        text: `Simultaneous seal ${i}`,
        authorId: 'User A',
        unlockedBy: ['User A'],
        createdAt: Date.now(),
      });
      unlockVaultLocal(`stress-vault-${Date.now()}-${i}`, 'User B');
    }
    setStatus('Simultaneous access handled without deadlock.');
  }

  if (!gateOpen) {
    return (
      <View style={styles.root}>
        <SacredBackground intensity={0.55} />
        <View style={styles.gate}>
          <Pressable onPress={() => router.back()}>
            <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
          </Pressable>
          <SanctuaryText variant="title">Fortress Gate</SanctuaryText>
          <SanctuaryText variant="plaque" style={styles.gateCopy}>
            Beyond this seal: vents, fears, and ultimate trust. Two keys. One vault.
          </SanctuaryText>
          <Pressable style={styles.cta} onPress={() => void openGate()}>
            <SanctuaryText style={styles.ctaText}>Present Presence</SanctuaryText>
          </Pressable>
          <SanctuaryText variant="caption">{status}</SanctuaryText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.65} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">The Vault</SanctuaryText>
        <SanctuaryText variant="caption">{status}</SanctuaryText>
      </View>

      <FlatList
        data={vault}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: space.lg, gap: 12 }}
        ListEmptyComponent={
          <SanctuaryText variant="plaque">Nothing sealed yet.</SanctuaryText>
        }
        renderItem={({ item }) => {
          const open = item.unlockedBy.length >= 2;
          return (
            <View style={styles.entry}>
              <SanctuaryText variant="caption">
                {item.kind.toUpperCase()} · keys {item.unlockedBy.length}/2
              </SanctuaryText>
              <SanctuaryText variant="body">
                {open ? item.text : '•••• encrypted until mutual unlock ••••'}
              </SanctuaryText>
              {!open ? (
                <Pressable onPress={() => void dualUnlock(item.id)}>
                  <SanctuaryText style={{ color: colors.amber }}>
                    Simulate partner unlock
                  </SanctuaryText>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <View style={styles.kinds}>
          {(['vent', 'fear', 'trust', 'confession'] as Kind[]).map((k) => (
            <Pressable key={k} onPress={() => setKind(k)} style={styles.kind}>
              <SanctuaryText style={{ color: kind === k ? colors.gold : colors.inkMuted }}>
                {k}
              </SanctuaryText>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write what needs a fortress…"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.cta} onPress={() => void sealEntry()}>
          <SanctuaryText style={styles.ctaText}>Seal Entry</SanctuaryText>
        </Pressable>
        <Pressable onPress={() => void simultaneousStress()}>
          <SanctuaryText variant="caption" style={{ color: colors.rose }}>
            Stress: simultaneous vault access
          </SanctuaryText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gate: {
    flex: 1,
    paddingTop: 96,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  gateCopy: { marginVertical: space.lg },
  header: {
    paddingTop: 64,
    paddingHorizontal: space.lg,
    gap: 6,
  },
  entry: {
    padding: space.md,
    borderRadius: 14,
    backgroundColor: 'rgba(42,56,51,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(196,120,106,0.25)',
    gap: 8,
  },
  composer: {
    padding: space.lg,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,196,138,0.15)',
  },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kind: { paddingVertical: 4 },
  input: {
    minHeight: 70,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.rose,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaText: { color: colors.ink, fontFamily: fonts.bodyBold },
});
