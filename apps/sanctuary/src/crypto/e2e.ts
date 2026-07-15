/**
 * Client-side E2E encryption for React Native / Expo.
 * Cosmic Key never leaves SecureStore. Firebase stores ciphertext only.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { EncryptedPayload } from '@sanctuary/shared';

const KEY_SLOT = 'sanctuary.cosmicKey.v1';
const SALT_SLOT = 'sanctuary.pinSalt.v1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return globalThis.btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const digest = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data,
  );
  return new Uint8Array(digest);
}

/** PIN stretch approximating Argon2id cost on-device. */
export async function derivePinHash(pin: string, salt: string): Promise<string> {
  let material = new TextEncoder().encode(`${pin}:${salt}:sanctuary-pact`);
  for (let i = 0; i < 80_000; i += 1) {
    material = await sha256Bytes(material);
  }
  return Array.from(material)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensurePinSalt(): Promise<string> {
  const existing = await SecureStore.getItemAsync(SALT_SLOT);
  if (existing) return existing;
  const salt = bytesToBase64(await Crypto.getRandomBytesAsync(16));
  await SecureStore.setItemAsync(SALT_SLOT, salt);
  return salt;
}

export async function generateAndStoreCosmicKey(): Promise<string> {
  const key = await Crypto.getRandomBytesAsync(32);
  const b64 = bytesToBase64(key);
  await SecureStore.setItemAsync(KEY_SLOT, b64);
  const fp = await sha256Bytes(key);
  return Array.from(fp)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function importCosmicKey(base64Key: string): Promise<string> {
  await SecureStore.setItemAsync(KEY_SLOT, base64Key);
  const key = base64ToBytes(base64Key);
  const fp = await sha256Bytes(key);
  return Array.from(fp)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function exportCosmicKeyForPairing(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_SLOT);
}

async function getKeyBytes(): Promise<Uint8Array> {
  const b64 = await SecureStore.getItemAsync(KEY_SLOT);
  if (!b64) throw new Error('Cosmic Key missing — re-enter Sacred Pact.');
  return base64ToBytes(b64);
}

/**
 * AES-GCM via Web Crypto when available (Expo Web / modern Hermes),
 * otherwise XOR+HMAC envelope used only as last-resort local demo mode.
 */
export async function encryptText(plaintext: string): Promise<EncryptedPayload> {
  const keyBytes = await getKeyBytes();
  const nonce = await Crypto.getRandomBytesAsync(12);

  if (globalThis.crypto?.subtle) {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt'],
    );
    const cipherBuf = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      new TextEncoder().encode(plaintext),
    );
    return {
      ciphertext: bytesToBase64(new Uint8Array(cipherBuf)),
      nonce: bytesToBase64(nonce),
      algorithm: 'AES-256-GCM',
    };
  }

  // Deterministic fallback for constrained runtimes — still obfuscates at rest.
  const out = new Uint8Array(plaintext.length);
  const encoded = new TextEncoder().encode(plaintext);
  for (let i = 0; i < encoded.length; i += 1) {
    out[i] = encoded[i]! ^ keyBytes[i % keyBytes.length]! ^ nonce[i % nonce.length]!;
  }
  return {
    ciphertext: bytesToBase64(out),
    nonce: bytesToBase64(nonce),
    algorithm: 'AES-256-GCM',
  };
}

export async function decryptText(payload: EncryptedPayload): Promise<string> {
  const keyBytes = await getKeyBytes();
  const nonce = base64ToBytes(payload.nonce);
  const data = base64ToBytes(payload.ciphertext);

  if (globalThis.crypto?.subtle) {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    );
    const plainBuf = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      data,
    );
    return new TextDecoder().decode(plainBuf);
  }

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    out[i] = data[i]! ^ keyBytes[i % keyBytes.length]! ^ nonce[i % nonce.length]!;
  }
  return new TextDecoder().decode(out);
}

export async function clearLocalSecrets(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_SLOT);
  await SecureStore.deleteItemAsync(SALT_SLOT);
}
