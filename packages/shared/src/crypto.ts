/**
 * End-to-end encryption helpers for Sanctuary.
 *
 * Production mobile clients use Web Crypto / expo-crypto with AES-256-GCM.
 * This module provides pure algorithms for Node simulation and Cloud Function
 * envelope handling (server never sees plaintext of vows/vault/dreams).
 *
 * Key model:
 * - Partner PIN derives Argon2id key material client-side (simulated here with
 *   a deterministic HKDF-like stretch for Node environments without WASM).
 * - Couple bond shares a 256-bit Cosmic Key, stored only in SecureStore /
 *   Keychain, never uploaded in plaintext.
 */

import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import type { EncryptedPayload } from './types';

const ALGO = 'aes-256-gcm' as const;

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Simulate Argon2id-ish PIN stretch (mobile app uses real Argon2id). */
export function derivePinKey(pin: string, salt: string): Buffer {
  let material = Buffer.from(`${pin}:${salt}:sanctuary-pact`, 'utf8');
  for (let i = 0; i < 120_000; i += 1) {
    material = createHash('sha256').update(material).digest();
  }
  return material;
}

export function hashPin(pin: string, salt: string): string {
  return sha256Hex(derivePinKey(pin, salt));
}

export function generateCosmicKey(): Buffer {
  return randomBytes(32);
}

export function keyFingerprint(key: Buffer): string {
  return sha256Hex(key).slice(0, 16);
}

export function encryptUtf8(plaintext: string, key: Buffer): EncryptedPayload {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([encrypted, tag]);
  return {
    ciphertext: packed.toString('base64'),
    nonce: nonce.toString('base64'),
    algorithm: 'AES-256-GCM',
  };
}

export function decryptUtf8(payload: EncryptedPayload, key: Buffer): string {
  const packed = Buffer.from(payload.ciphertext, 'base64');
  const nonce = Buffer.from(payload.nonce, 'base64');
  const tag = packed.subarray(packed.length - 16);
  const data = packed.subarray(0, packed.length - 16);
  const decipher = createDecipheriv(ALGO, key, nonce);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/** HMAC for Link pulse authenticity between partners. */
export function signPulse(payload: string, key: Buffer): string {
  return createHmac('sha256', key).update(payload).digest('hex');
}

export function verifyPulse(payload: string, key: Buffer, signature: string): boolean {
  const expected = signPulse(payload, key);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function clampHeartbeat(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Heartbeat vitality from recent relational activity.
 * Tuned so 90-day healthy use settles near 72–92.
 */
export function computeHeartbeat(input: {
  cherishesLast7d: number;
  linkPulsesLast24h: number;
  vowsLast30d: number;
  vaultTrustEvents: number;
  daysSinceLastConnection: number;
}): number {
  const base = 48;
  const cherish = Math.min(22, input.cherishesLast7d * 2.2);
  const link = Math.min(16, input.linkPulsesLast24h * 1.5);
  const vows = Math.min(12, input.vowsLast30d * 1.4);
  const trust = Math.min(10, input.vaultTrustEvents * 2);
  const decay = Math.min(40, input.daysSinceLastConnection * 6);
  return clampHeartbeat(base + cherish + link + vows + trust - decay);
}
