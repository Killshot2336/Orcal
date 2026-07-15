/**
 * 90-day dual-user high-fidelity simulation of Sanctuary.
 * Models User A and User B across every feature pillar.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OracleTopic, VowType } from '@sanctuary/shared';
import {
  askOracle,
  bodyMapTouch,
  cherish,
  createWorld,
  dream,
  placeVow,
  refreshHeartbeat,
  sendLink,
  unlockWithPin,
  vaultDualUnlock,
  vaultSeal,
  weaveMemory,
  type SimWorld,
} from './world.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'output');

const VOW_TYPES: VowType[] = ['daily', 'sacred', 'desire'];
const TOPICS: OracleTopic[] = [
  'deep_connection',
  'naughty_exploration',
  'future_dreams',
  'healing',
  'playful',
];
const REGIONS = ['heart', 'hands', 'shoulders', 'belly', 'crown'];
const DREAM_POOL = [
  { text: 'We walked through a moonlit forest holding the same key.', themes: ['forest', 'moon', 'key'] },
  { text: 'An ocean house rose from the water and opened a soft door.', themes: ['ocean', 'house', 'door', 'water'] },
  { text: 'I flew above a garden storm and landed in your light.', themes: ['flight', 'garden', 'storm', 'light'] },
];

function dayScript(world: SimWorld, day: number) {
  const actorPrimary: 'A' | 'B' = day % 2 === 0 ? 'A' : 'B';
  const actorSecondary: 'A' | 'B' = actorPrimary === 'A' ? 'B' : 'A';
  const now = Date.now() + day * 86_400_000;

  // Daily rhythm
  if (day === 1) {
    unlockWithPin(world, 'A', '2468');
    unlockWithPin(world, 'B', '1357');
  }

  placeVow(
    world,
    day,
    actorPrimary,
    VOW_TYPES[day % 3]!,
    `Day ${day} vow from ${actorPrimary}: presence over armor.`,
  );

  if (world.vows.length > 1) {
    cherish(world, day, actorSecondary, world.vows.length - 2);
  }

  weaveMemory(
    world,
    day,
    actorSecondary,
    day % 4 === 0 ? 'voice' : day % 3 === 0 ? 'screenshot' : 'photo',
    180_000 + (day % 7) * 12_000,
  );

  askOracle(world, day, actorPrimary, TOPICS[day % TOPICS.length]!);

  sendLink(
    world,
    day,
    actorSecondary,
    day % 3 === 0 ? 'haptic_whisper' : day % 3 === 1 ? 'emoji_touch' : 'heartbeat_presence',
    now,
  );

  if (day % 5 === 0) {
    vaultSeal(world, day, actorPrimary, `Private trust note day ${day}`);
    vaultDualUnlock(world, day, actorPrimary, world.vault.length - 1);
    vaultDualUnlock(world, day, actorSecondary, world.vault.length - 1);
  }

  if (day % 3 === 0) {
    const dreamItem = DREAM_POOL[day % DREAM_POOL.length]!;
    dream(world, day, actorPrimary, dreamItem.text, dreamItem.themes);
    dream(world, day, actorSecondary, dreamItem.text, dreamItem.themes);
  }

  if (day % 4 === 0) {
    bodyMapTouch(world, day, actorPrimary, REGIONS[day % REGIONS.length]!);
  }

  refreshHeartbeat(world, day);
}

function summarize(world: SimWorld) {
  const failed = world.logs.filter((l) => !l.ok);
  const byFeature = new Map<string, { ok: number; fail: number; maxMs: number; sumMs: number }>();
  for (const l of world.logs) {
    const row = byFeature.get(l.feature) ?? { ok: 0, fail: 0, maxMs: 0, sumMs: 0 };
    if (l.ok) row.ok += 1;
    else row.fail += 1;
    row.maxMs = Math.max(row.maxMs, l.ms);
    row.sumMs += l.ms;
    byFeature.set(l.feature, row);
  }

  const features = [...byFeature.entries()].map(([feature, s]) => ({
    feature,
    ok: s.ok,
    fail: s.fail,
    avgMs: Number((s.sumMs / Math.max(1, s.ok + s.fail)).toFixed(3)),
    maxMs: Number(s.maxMs.toFixed(3)),
  }));

  return {
    days: 90,
    users: ['User A', 'User B'],
    bondId: world.bondId,
    keyFingerprint: world.keyFingerprint,
    totals: {
      vows: world.vows.length,
      cherishes: world.vows.reduce((n, v) => n + v.cherishCount, 0),
      memories: world.memories.length,
      linkPulses: world.linkPulses.length,
      vaultEntries: world.vault.length,
      vaultMutuallyOpen: world.vault.filter((v) => v.unlockedBy.length >= 2).length,
      dreams: world.dreams.length,
      oracleQuestions: world.oracleQuestions.length,
      bodyTouches: world.bodyTouches,
      constellationPoints: world.constellationPoints,
      finalHeartbeat: world.heartbeat,
      events: world.logs.length,
      failures: failed.length,
    },
    features,
    bugs: world.bugs,
    verdict:
      failed.length === 0 && world.bugs.length === 0
        ? 'ZERO BUGS — flawless 90-day dual-user simulation'
        : `ISSUES DETECTED — ${failed.length} failed events`,
    sampleOracle: world.oracleQuestions.slice(0, 3),
  };
}

function main() {
  const world = createWorld();
  const t0 = performance.now();

  for (let day = 1; day <= 90; day += 1) {
    dayScript(world, day);
  }

  const report = {
    ...summarize(world),
    elapsedMs: Number((performance.now() - t0).toFixed(2)),
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'simulation-90-day.json'), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT_DIR, 'simulation-90-day.md'),
    renderMarkdown(report),
  );

  // Console summary for CI
  console.log(JSON.stringify({ verdict: report.verdict, totals: report.totals, elapsedMs: report.elapsedMs }, null, 2));

  if (report.totals.failures > 0) {
    process.exitCode = 1;
  }
}

function renderMarkdown(report: ReturnType<typeof summarize> & { elapsedMs: number; generatedAt: string }) {
  const lines = [
    '# Sanctuary 90-Day Simulation Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `## Verdict`,
    '',
    `**${report.verdict}**`,
    '',
    `Elapsed: ${report.elapsedMs}ms`,
    '',
    '## Totals',
    '',
    ...Object.entries(report.totals).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Feature latency',
    '',
    '| Feature | OK | Fail | Avg ms | Max ms |',
    '|---|---:|---:|---:|---:|',
    ...report.features.map(
      (f) => `| ${f.feature} | ${f.ok} | ${f.fail} | ${f.avgMs} | ${f.maxMs} |`,
    ),
    '',
    '## Sample Oracle questions',
    '',
    ...report.sampleOracle.map((q) => `- ${q}`),
    '',
    '## Bugs',
    '',
    report.bugs.length ? report.bugs.map((b) => `- ${b}`).join('\n') : '_None_',
    '',
  ];
  return lines.join('\n');
}

main();
