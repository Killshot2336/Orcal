import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decryptUtf8,
  encryptUtf8,
  generateCosmicKey,
  hashPin,
  keyFingerprint,
  signPulse,
  verifyPulse,
  computeHeartbeat,
} from './crypto.ts';

describe('Sanctuary crypto', () => {
  it('round-trips AES-GCM payloads', () => {
    const key = generateCosmicKey();
    const payload = encryptUtf8('our sacred vow', key);
    assert.equal(decryptUtf8(payload, key), 'our sacred vow');
    assert.equal(payload.algorithm, 'AES-256-GCM');
  });

  it('produces stable pin hashes and fingerprints', () => {
    const a = hashPin('2468', 'salt-a');
    const b = hashPin('2468', 'salt-a');
    const c = hashPin('2468', 'salt-b');
    assert.equal(a, b);
    assert.notEqual(a, c);
    const key = generateCosmicKey();
    assert.equal(keyFingerprint(key).length, 16);
  });

  it('verifies link pulse signatures', () => {
    const key = generateCosmicKey();
    const sig = signPulse('heartbeat_presence:1710000000', key);
    assert.equal(verifyPulse('heartbeat_presence:1710000000', key, sig), true);
    assert.equal(verifyPulse('tampered', key, sig), false);
  });

  it('computes heartbeat in valid range', () => {
    const score = computeHeartbeat({
      cherishesLast7d: 8,
      linkPulsesLast24h: 4,
      vowsLast30d: 5,
      vaultTrustEvents: 2,
      daysSinceLastConnection: 0,
    });
    assert.ok(score >= 70 && score <= 100);
  });
});
