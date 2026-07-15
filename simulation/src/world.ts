/**
 * High-fidelity Sanctuary world model for User A + User B over N days.
 */

import {
  computeHeartbeat,
  decryptUtf8,
  encryptUtf8,
  generateCosmicKey,
  hashPin,
  keyFingerprint,
  offlineOracle,
  signPulse,
  verifyPulse,
  type LinkNotificationType,
  type OracleTopic,
  type VowType,
} from '@sanctuary/shared';

export interface SimLog {
  day: number;
  actor: 'A' | 'B' | 'SYSTEM';
  feature: string;
  event: string;
  ok: boolean;
  ms: number;
  detail?: string;
}

export interface SimWorld {
  bondId: string;
  cosmicKey: Buffer;
  keyFingerprint: string;
  pinHashA: string;
  pinHashB: string;
  heartbeat: number;
  vows: Array<{
    id: string;
    type: VowType;
    author: 'A' | 'B';
    payload: ReturnType<typeof encryptUtf8>;
    cherishCount: number;
  }>;
  memories: Array<{
    id: string;
    kind: string;
    sizeBytes: number;
    author: 'A' | 'B';
  }>;
  linkPulses: Array<{
    id: string;
    type: LinkNotificationType;
    from: 'A' | 'B';
    signature: string;
    at: number;
  }>;
  vault: Array<{
    id: string;
    author: 'A' | 'B';
    payload: ReturnType<typeof encryptUtf8>;
    unlockedBy: Array<'A' | 'B'>;
  }>;
  dreams: Array<{
    id: string;
    author: 'A' | 'B';
    themes: string[];
    payload: ReturnType<typeof encryptUtf8>;
  }>;
  oracleQuestions: string[];
  bodyTouches: number;
  constellationPoints: number;
  rateBucket: Map<string, number[]>;
  bugs: string[];
  logs: SimLog[];
}

export function createWorld(): SimWorld {
  const cosmicKey = generateCosmicKey();
  return {
    bondId: 'sim-bond-90d',
    cosmicKey,
    keyFingerprint: keyFingerprint(cosmicKey),
    pinHashA: hashPin('2468', 'salt-a'),
    pinHashB: hashPin('1357', 'salt-b'),
    heartbeat: 55,
    vows: [],
    memories: [],
    linkPulses: [],
    vault: [],
    dreams: [],
    oracleQuestions: [],
    bodyTouches: 0,
    constellationPoints: 0,
    rateBucket: new Map(),
    bugs: [],
    logs: [],
  };
}

function log(
  world: SimWorld,
  day: number,
  actor: SimLog['actor'],
  feature: string,
  event: string,
  ok: boolean,
  ms: number,
  detail?: string,
) {
  world.logs.push({ day, actor, feature, event, ok, ms, detail });
  if (!ok) world.bugs.push(`D${day} ${feature}: ${event} — ${detail ?? 'fail'}`);
}

function assertRate(world: SimWorld, key: string, max: number, windowMs: number, now: number) {
  const stamps = (world.rateBucket.get(key) ?? []).filter((t) => now - t < windowMs);
  if (stamps.length >= max) return false;
  stamps.push(now);
  world.rateBucket.set(key, stamps);
  return true;
}

export function unlockWithPin(world: SimWorld, actor: 'A' | 'B', pin: string): boolean {
  const t0 = performance.now();
  const hash = hashPin(pin, actor === 'A' ? 'salt-a' : 'salt-b');
  const ok = hash === (actor === 'A' ? world.pinHashA : world.pinHashB);
  log(world, 0, actor, 'pin', 'unlock', ok, performance.now() - t0);
  return ok;
}

export function placeVow(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  type: VowType,
  text: string,
) {
  const t0 = performance.now();
  const payload = encryptUtf8(text, world.cosmicKey);
  const roundTrip = decryptUtf8(payload, world.cosmicKey) === text;
  world.vows.push({
    id: `vow-${day}-${actor}-${world.vows.length}`,
    type,
    author: actor,
    payload,
    cherishCount: 0,
  });
  log(world, day, actor, 'vow-wall', 'place', roundTrip, performance.now() - t0, type);
  if (!roundTrip) return;
}

export function cherish(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  vowIndex: number,
) {
  const t0 = performance.now();
  const vow = world.vows[vowIndex];
  if (!vow) {
    log(world, day, actor, 'vow-wall', 'cherish', false, performance.now() - t0, 'missing');
    return;
  }
  vow.cherishCount += 1;
  log(world, day, actor, 'vow-wall', 'cherish-animation', true, performance.now() - t0);
}

export function weaveMemory(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  kind: string,
  sizeBytes: number,
) {
  const t0 = performance.now();
  const max = 55 * 1024 * 1024;
  const ok = sizeBytes <= max;
  if (ok) {
    world.memories.push({
      id: `mem-${day}-${actor}-${world.memories.length}`,
      kind,
      sizeBytes,
      author: actor,
    });
  }
  log(
    world,
    day,
    actor,
    'loom',
    'weave',
    ok,
    performance.now() - t0,
    `${kind}:${Math.round(sizeBytes / 1024)}KB`,
  );
}

export function sendLink(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  type: LinkNotificationType,
  now: number,
) {
  const t0 = performance.now();
  const allowed = assertRate(world, 'link', 100, 60_000, now);
  if (!allowed) {
    log(world, day, actor, 'link', 'rate-limited', true, performance.now() - t0, 'soft-reject');
    return { accepted: false };
  }
  const payload = `${type}:${now}:${actor}`;
  const signature = signPulse(payload, world.cosmicKey);
  const authentic = verifyPulse(payload, world.cosmicKey, signature);
  world.linkPulses.push({
    id: `link-${world.linkPulses.length}`,
    type,
    from: actor,
    signature,
    at: now,
  });
  log(world, day, actor, 'link', 'pulse', authentic, performance.now() - t0, type);
  return { accepted: authentic };
}

export function vaultSeal(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  text: string,
) {
  const t0 = performance.now();
  const payload = encryptUtf8(text, world.cosmicKey);
  world.vault.push({
    id: `vault-${world.vault.length}`,
    author: actor,
    payload,
    unlockedBy: [actor],
  });
  log(world, day, actor, 'vault', 'seal', true, performance.now() - t0);
}

export function vaultDualUnlock(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  index: number,
) {
  const t0 = performance.now();
  const entry = world.vault[index];
  if (!entry) {
    log(world, day, actor, 'vault', 'unlock', false, performance.now() - t0, 'missing');
    return;
  }
  if (!entry.unlockedBy.includes(actor)) entry.unlockedBy.push(actor);
  const open = entry.unlockedBy.length >= 2;
  const readable = open
    ? decryptUtf8(entry.payload, world.cosmicKey).length > 0
    : true;
  log(
    world,
    day,
    actor,
    'vault',
    'dual-unlock',
    readable,
    performance.now() - t0,
    open ? 'mutual' : 'waiting',
  );
}

export function dream(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  text: string,
  themes: string[],
) {
  const t0 = performance.now();
  world.dreams.push({
    id: `dream-${world.dreams.length}`,
    author: actor,
    themes,
    payload: encryptUtf8(text, world.cosmicKey),
  });
  log(world, day, actor, 'dreams', 'record', true, performance.now() - t0, themes.join(','));
}

export function askOracle(
  world: SimWorld,
  day: number,
  actor: 'A' | 'B',
  topic: OracleTopic,
  bodyRegion?: string,
) {
  const t0 = performance.now();
  const now = Date.now() + day * 86_400_000;
  const allowed = assertRate(world, 'oracle', 30, 60_000, now);
  if (!allowed) {
    log(world, day, actor, 'oracle', 'rate-limited', true, performance.now() - t0);
    return;
  }
  const res = offlineOracle({
    bondId: world.bondId,
    topic,
    bodyRegion,
    dreamThemes: world.dreams.flatMap((d) => d.themes).slice(-6),
  });
  const ok = Boolean(res.question && res.question.length > 10);
  world.oracleQuestions.push(res.question);
  log(world, day, actor, 'oracle', 'question', ok, performance.now() - t0, topic);
}

export function bodyMapTouch(world: SimWorld, day: number, actor: 'A' | 'B', region: string) {
  world.bodyTouches += 1;
  askOracle(world, day, actor, 'naughty_exploration', region);
}

export function refreshHeartbeat(world: SimWorld, day: number) {
  const t0 = performance.now();
  const recentCherish = world.vows.reduce((n, v) => n + Math.min(3, v.cherishCount), 0);
  const link24 = world.linkPulses.filter((p) => p.at > Date.now() - 86_400_000).length;
  world.heartbeat = computeHeartbeat({
    cherishesLast7d: Math.min(20, recentCherish),
    linkPulsesLast24h: Math.min(20, link24 || Math.floor(world.linkPulses.length / Math.max(1, day))),
    vowsLast30d: world.vows.filter((_, i) => i >= world.vows.length - 30).length,
    vaultTrustEvents: world.vault.filter((v) => v.unlockedBy.length >= 2).length,
    daysSinceLastConnection: 0,
  });
  world.constellationPoints = Math.min(
    200,
    world.vows.length + world.memories.length + world.dreams.length + Math.floor(world.heartbeat / 5),
  );
  const ok = world.heartbeat >= 0 && world.heartbeat <= 100;
  log(world, day, 'SYSTEM', 'observatory', 'constellation', ok, performance.now() - t0, `hb=${world.heartbeat}`);
}
