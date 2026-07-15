/**
 * Stress suite:
 * 1) 100 Link notifications in one minute
 * 2) 50MB Loom video weave
 * 3) Simultaneous Vault dual-access
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createWorld,
  sendLink,
  vaultDualUnlock,
  vaultSeal,
  weaveMemory,
} from './world.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'output');

function main() {
  const world = createWorld();
  const now = Date.now();
  const results: Array<{ name: string; ok: boolean; detail: string }> = [];

  // 1) 100 Link pulses / minute
  let accepted = 0;
  let rejected = 0;
  for (let i = 0; i < 100; i += 1) {
    const res = sendLink(
      world,
      1,
      i % 2 === 0 ? 'A' : 'B',
      i % 3 === 0 ? 'haptic_whisper' : i % 3 === 1 ? 'emoji_touch' : 'heartbeat_presence',
      now + i * 10,
    );
    if (res.accepted) accepted += 1;
    else rejected += 1;
  }
  // 101st should soft-reject
  const overflow = sendLink(world, 1, 'A', 'heartbeat_presence', now + 1500);
  results.push({
    name: 'link-100-per-minute',
    ok: accepted === 100 && overflow.accepted === false,
    detail: `accepted=${accepted}, overflowRejected=${!overflow.accepted}, softRejectsLogged=${rejected}`,
  });

  // 2) 50MB video to The Loom
  weaveMemory(world, 1, 'A', 'video', 50 * 1024 * 1024);
  // oversize should fail
  weaveMemory(world, 1, 'B', 'video', 60 * 1024 * 1024);
  const bigOk = world.memories.some((m) => m.sizeBytes === 50 * 1024 * 1024);
  const oversizeBlocked = !world.memories.some((m) => m.sizeBytes > 55 * 1024 * 1024);
  results.push({
    name: 'loom-50mb-video',
    ok: bigOk && oversizeBlocked,
    detail: `stored50mb=${bigOk}, blocked60mb=${oversizeBlocked}`,
  });

  // 3) Simultaneous vault access
  vaultSeal(world, 1, 'A', 'simultaneous fear note');
  // interleaved unlocks
  vaultDualUnlock(world, 1, 'A', 0);
  vaultDualUnlock(world, 1, 'B', 0);
  vaultDualUnlock(world, 1, 'A', 0); // idempotent
  vaultDualUnlock(world, 1, 'B', 0);
  const entry = world.vault[0]!;
  results.push({
    name: 'vault-simultaneous',
    ok: entry.unlockedBy.length === 2 && new Set(entry.unlockedBy).size === 2,
    detail: `unlockedBy=${entry.unlockedBy.join('+')}`,
  });

  const allOk = results.every((r) => r.ok);
  const report = {
    verdict: allOk
      ? 'ZERO BUGS — stress suite passed'
      : 'STRESS FAILURES DETECTED',
    results,
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'stress-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT_DIR, 'stress-report.md'),
    [
      '# Sanctuary Stress Report',
      '',
      `**${report.verdict}**`,
      '',
      ...results.map((r) => `- ${r.ok ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`),
      '',
    ].join('\n'),
  );

  console.log(JSON.stringify(report, null, 2));
  if (!allOk) process.exitCode = 1;
}

main();
