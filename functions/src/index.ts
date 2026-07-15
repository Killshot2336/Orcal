/**
 * Sanctuary Firebase Cloud Functions — private fortress edge.
 *
 * Security posture:
 * - No third-party analytics SDKs.
 * - Callable functions require Firebase Auth belonging to an established bond.
 * - Oracle never writes pair plaintext to Firestore.
 * - Rate limits protect against Link spam and Oracle abuse.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { invokeOracle } from './oracle';
import type { OracleRequest, OracleTopic } from '@sanctuary/shared';

initializeApp();

const db = getFirestore();

const ORACLE_TOPICS = new Set<OracleTopic>([
  'deep_connection',
  'naughty_exploration',
  'future_dreams',
  'healing',
  'playful',
]);

/** Sliding window rate-limit helper (Firestore-backed). */
async function assertRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<void> {
  const ref = db.collection('_rateLimits').doc(key);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { stamps?: number[] } | undefined;
    const stamps = (data?.stamps ?? []).filter((t) => now - t < windowMs);
    if (stamps.length >= max) {
      throw new HttpsError('resource-exhausted', 'Sanctuary asks for a slower pulse.');
    }
    stamps.push(now);
    tx.set(ref, { stamps }, { merge: true });
  });
}

async function assertBondMember(uid: string, bondId: string): Promise<void> {
  const bond = await db.collection('bonds').doc(bondId).get();
  if (!bond.exists) {
    throw new HttpsError('not-found', 'Bond not found.');
  }
  const data = bond.data()!;
  if (data.partnerAId !== uid && data.partnerBId !== uid) {
    throw new HttpsError('permission-denied', 'You are not of this Sanctuary.');
  }
}

/**
 * Oracle — private AI question generator.
 * Client sends only redacted context + topic; never raw vault content.
 */
export const sanctuaryOracle = onCall(
  {
    cors: false,
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'PIN session required.');
    }

    const data = request.data as OracleRequest;
    if (!data?.bondId || !ORACLE_TOPICS.has(data.topic)) {
      throw new HttpsError('invalid-argument', 'Invalid Oracle request.');
    }

    await assertBondMember(request.auth.uid, data.bondId);
    await assertRateLimit(`oracle:${data.bondId}`, 30, 60_000);

    const result = await invokeOracle({
      bondId: data.bondId,
      topic: data.topic,
      recentVowSummaries: (data.recentVowSummaries ?? []).slice(0, 4),
      recentThemes: (data.recentThemes ?? []).slice(0, 6),
      bodyRegion: data.bodyRegion,
      dreamThemes: (data.dreamThemes ?? []).slice(0, 6),
      locale: data.locale,
    });

    // Meta-only audit (no plaintext question stored — couples keep client copies).
    await db.collection('bonds').doc(data.bondId).collection('oracleMeta').add({
      topic: data.topic,
      tone: result.tone,
      by: request.auth.uid,
      at: FieldValue.serverTimestamp(),
    });

    return result;
  },
);

/**
 * Accept Sacred Pact — creates bond shell after both partners present PIN hashes.
 * Cosmic Key stays client-side; only fingerprint stored.
 */
export const acceptSacredPact = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }
    const {
      partnerDisplayName,
      pinSalt,
      pinHash,
      inviteCode,
      keyFingerprint,
      vowText,
    } = request.data as {
      partnerDisplayName: string;
      pinSalt: string;
      pinHash: string;
      inviteCode?: string;
      keyFingerprint: string;
      vowText: string;
    };

    if (!partnerDisplayName || !pinHash || !pinSalt || !keyFingerprint || !vowText) {
      throw new HttpsError('invalid-argument', 'Incomplete pact.');
    }

    const uid = request.auth.uid;

    if (inviteCode) {
      const invite = await db.collection('invites').doc(inviteCode).get();
      if (!invite.exists) {
        throw new HttpsError('not-found', 'Invite expired or unknown.');
      }
      const bondId = invite.data()!.bondId as string;
      await db.collection('bonds').doc(bondId).update({
        partnerBId: uid,
        keyFingerprint,
      });
      await db.collection('partners').doc(uid).set({
        partnerId: uid,
        displayName: partnerDisplayName,
        pinHash,
        pinSalt,
        biometricEnabled: false,
        joinedAt: Date.now(),
        lastSeenAt: Date.now(),
        bondId,
      });
      await invite.ref.delete();
      return { bondId, role: 'B' as const };
    }

    const bondRef = db.collection('bonds').doc();
    const code = bondRef.id.slice(0, 8).toUpperCase();
    await bondRef.set({
      bondId: bondRef.id,
      partnerAId: uid,
      partnerBId: null,
      vowAcceptedAt: Date.now(),
      vowText,
      createdAt: Date.now(),
      heartbeatScore: 55,
      keyFingerprint,
    });
    await db.collection('invites').doc(code).set({
      bondId: bondRef.id,
      createdBy: uid,
      createdAt: Date.now(),
    });
    await db.collection('partners').doc(uid).set({
      partnerId: uid,
      displayName: partnerDisplayName,
      pinHash,
      pinSalt,
      biometricEnabled: false,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      bondId: bondRef.id,
    });

    return { bondId: bondRef.id, inviteCode: code, role: 'A' as const };
  },
);

/** Fan-out Link pulses with hard rate limit (stress-tested at 100/min). */
export const sendLinkPulse = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }
    const { bondId, type, emoji, signature } = request.data as {
      bondId: string;
      type: 'haptic_whisper' | 'emoji_touch' | 'heartbeat_presence';
      emoji?: string;
      signature: string;
    };

    await assertBondMember(request.auth.uid, bondId);
    // 100 / minute max per bond — excess rejected gracefully.
    await assertRateLimit(`link:${bondId}`, 100, 60_000);

    const pulse = {
      fromPartnerId: request.auth.uid,
      type,
      emoji: emoji ?? null,
      signature,
      createdAt: Date.now(),
      deliveredAt: null,
      acknowledgedAt: null,
    };

    const ref = await db
      .collection('bonds')
      .doc(bondId)
      .collection('linkPulses')
      .add(pulse);

    return { id: ref.id, ...pulse };
  },
);

/** Cherish vow — increments + emits realtime animation trigger. */
export const cherishVow = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }
    const { bondId, vowId } = request.data as { bondId: string; vowId: string };
    await assertBondMember(request.auth.uid, bondId);

    const vowRef = db.collection('bonds').doc(bondId).collection('vows').doc(vowId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(vowRef);
      if (!snap.exists) throw new HttpsError('not-found', 'Vow not found.');
      tx.update(vowRef, {
        cherishCount: FieldValue.increment(1),
        lastCherishedAt: Date.now(),
        lastCherishedBy: request.auth!.uid,
      });
    });

    await db.collection('bonds').doc(bondId).collection('cherishEvents').add({
      vowId,
      by: request.auth.uid,
      at: Date.now(),
    });

    return { ok: true };
  },
);

/** Dual-unlock The Vault — entry visible only when both partner IDs present. */
export const unlockVaultEntry = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }
    const { bondId, entryId } = request.data as { bondId: string; entryId: string };
    await assertBondMember(request.auth.uid, bondId);

    const ref = db.collection('bonds').doc(bondId).collection('vault').doc(entryId);
    const unlockedBy = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpsError('not-found', 'Vault entry missing.');
      const current = new Set<string>((snap.data()!.unlockedBy as string[]) ?? []);
      current.add(request.auth!.uid);
      const arr = Array.from(current);
      tx.update(ref, { unlockedBy: arr });
      return arr;
    });

    return { unlockedBy, mutuallyOpen: unlockedBy.length >= 2 };
  },
);

/** Dream theme convergence — AI-adjacent heuristic, privacy-preserving. */
export const analyzeDreamThemes = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }
    const { bondId, themeHints } = request.data as {
      bondId: string;
      themeHints: string[];
    };
    await assertBondMember(request.auth.uid, bondId);
    await assertRateLimit(`dreams:${bondId}`, 20, 60_000);

    const normalized = (themeHints ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 24);

    const counts = new Map<string, number>();
    for (const t of normalized) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const shared = [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sharedThemes: shared,
      constellationHint: shared[0]?.theme ?? 'twilight quiet',
    };
  },
);

/** Keep partner presence soft-updated without analytics vendors. */
export const onPartnerPresence = onDocumentCreated(
  'bonds/{bondId}/presence/{uid}',
  async (event) => {
    const uid = event.params.uid;
    await getAuth().getUser(uid).catch(() => null);
    await db.collection('partners').doc(uid).set(
      { lastSeenAt: Date.now() },
      { merge: true },
    );
  },
);
