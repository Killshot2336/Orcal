import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SacredBackground } from '../src/components/SacredBackground';
import { SanctuaryText } from '../src/components/SanctuaryText';
import { useSanctuaryStore } from '../src/state/sanctuaryStore';
import { colors, fonts, space } from '../src/theme/tokens';
import { callDreamThemes } from '../src/services/firebase';
import { encryptText } from '../src/crypto/e2e';

const THEME_WORDS = [
  'water', 'flight', 'door', 'forest', 'mirror', 'child', 'train',
  'light', 'storm', 'garden', 'key', 'ocean', 'house', 'moon',
];

function extractThemes(text: string): string[] {
  const lower = text.toLowerCase();
  return THEME_WORDS.filter((w) => lower.includes(w));
}

/**
 * Phase 4 — Shared Dreams: The Slumber Room
 * Record/transcribe dreams + AI theme convergence.
 */
export default function DreamsScreen() {
  const dreams = useSanctuaryStore((s) => s.dreams);
  const addDream = useSanctuaryStore((s) => s.addDream);
  const bondId = useSanctuaryStore((s) => s.bondId);
  const displayName = useSanctuaryStore((s) => s.displayName);
  const [draft, setDraft] = useState('');
  const [shared, setShared] = useState<string>('No shared constellation yet.');

  const allThemes = useMemo(
    () => dreams.flatMap((d) => d.themes),
    [dreams],
  );

  async function saveDream() {
    if (!draft.trim()) return;
    const themes = extractThemes(draft);
    addDream({
      id: `dream-${Date.now()}`,
      text: draft.trim(),
      themes,
      createdAt: Date.now(),
      authorId: displayName || 'A',
    });
    try {
      await encryptText(draft.trim());
    } catch {
      /* local */
    }

    const hints = [...allThemes, ...themes];
    if (bondId) {
      try {
        const res = (await callDreamThemes({ bondId, themeHints: hints })) as {
          sharedThemes: Array<{ theme: string }>;
          constellationHint: string;
        };
        setShared(
          res.sharedThemes.length
            ? `Shared themes: ${res.sharedThemes.map((t) => t.theme).join(', ')} · ${res.constellationHint}`
            : `Awaiting overlap · hint: ${res.constellationHint}`,
        );
      } catch {
        setShared(localShared(hints));
      }
    } else {
      setShared(localShared(hints));
    }
    setDraft('');
  }

  return (
    <View style={styles.root}>
      <SacredBackground intensity={0.85} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SanctuaryText variant="caption">← Sanctuary</SanctuaryText>
        </Pressable>
        <SanctuaryText variant="title">Slumber Room</SanctuaryText>
        <SanctuaryText variant="caption">{shared}</SanctuaryText>
      </View>

      <FlatList
        data={dreams}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: space.lg, gap: 12 }}
        ListEmptyComponent={
          <SanctuaryText variant="plaque">
            Night is unwritten. Offer a dream fragment.
          </SanctuaryText>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <SanctuaryText variant="body">{item.text}</SanctuaryText>
            <SanctuaryText variant="caption">
              Themes · {item.themes.join(', ') || 'drifting'}
            </SanctuaryText>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Transcribe last night’s dream…"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.cta} onPress={() => void saveDream()}>
          <SanctuaryText style={styles.ctaText}>Weave into Night</SanctuaryText>
        </Pressable>
      </View>
    </View>
  );
}

function localShared(hints: string[]): string {
  const counts = new Map<string, number>();
  for (const h of hints) counts.set(h, (counts.get(h) ?? 0) + 1);
  const shared = [...counts.entries()].filter(([, n]) => n >= 2).map(([t]) => t);
  return shared.length
    ? `Shared themes: ${shared.join(', ')}`
    : 'Awaiting a shared dream constellation.';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingHorizontal: space.lg,
    gap: 6,
  },
  card: {
    padding: space.md,
    borderRadius: 14,
    backgroundColor: 'rgba(42,56,51,0.6)',
    gap: 8,
  },
  composer: {
    padding: space.lg,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,196,138,0.15)',
  },
  input: {
    minHeight: 80,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sage,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaText: { color: colors.bgDeep, fontFamily: fonts.bodyBold },
});
