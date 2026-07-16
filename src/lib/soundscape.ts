/** Generative Web Audio soundscape — soft, intimate, never loud. */

type Chamber =
  | 'home'
  | 'oracle'
  | 'loom'
  | 'vault'
  | 'vow'
  | 'link'
  | 'observatory'
  | 'dreams'
  | 'temple'
  | 'onboarding'
  | 'pin';

let ctx: AudioContext | null = null;
let ambientNodes: Array<AudioNode> = [];
let currentChamber: Chamber | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Call on first user gesture so browsers allow audio. */
export async function unlockAudio(): Promise<void> {
  const c = ac();
  if (c.state === 'suspended') await c.resume();
}

function stopAmbient() {
  for (const n of ambientNodes) {
    try {
      n.disconnect();
    } catch {
      /* ignore */
    }
  }
  ambientNodes = [];
}

function noiseBuffer(seconds = 2): AudioBuffer {
  const c = ac();
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Soft chamber drone / texture. */
export async function playChamberAmbient(chamber: Chamber): Promise<void> {
  if (currentChamber === chamber && ambientNodes.length) return;
  await unlockAudio();
  stopAmbient();
  currentChamber = chamber;
  const c = ac();
  const master = c.createGain();
  master.gain.value = 0.028;
  master.connect(c.destination);

  const profiles: Record<Chamber, { freq: number; noise: number; filter: number }> = {
    home: { freq: 110, noise: 0.15, filter: 600 },
    oracle: { freq: 82, noise: 0.08, filter: 900 },
    loom: { freq: 98, noise: 0.22, filter: 1200 },
    vault: { freq: 65, noise: 0.3, filter: 400 },
    vow: { freq: 130, noise: 0.12, filter: 800 },
    link: { freq: 148, noise: 0.1, filter: 1000 },
    observatory: { freq: 90, noise: 0.06, filter: 1400 },
    dreams: { freq: 75, noise: 0.18, filter: 500 },
    temple: { freq: 100, noise: 0.14, filter: 700 },
    onboarding: { freq: 120, noise: 0.1, filter: 850 },
    pin: { freq: 95, noise: 0.05, filter: 550 },
  };

  const p = profiles[chamber];
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = p.freq;
  const oscGain = c.createGain();
  oscGain.gain.value = 0.45;
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start();

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(3);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = p.filter;
  const noiseGain = c.createGain();
  noiseGain.gain.value = p.noise;
  src.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  src.start();

  // Slow LFO on master for living breath
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.012;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();

  ambientNodes = [osc, oscGain, src, filter, noiseGain, lfo, lfoGain, master];
}

export type Sfx = 'tap' | 'cherish' | 'link' | 'oracle' | 'seal' | 'whoosh' | 'success';

export async function playSfx(kind: Sfx): Promise<void> {
  await unlockAudio();
  const c = ac();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  const table: Record<Sfx, { f: number; type: OscillatorType; dur: number; peak: number }> = {
    tap: { f: 520, type: 'sine', dur: 0.08, peak: 0.04 },
    cherish: { f: 340, type: 'triangle', dur: 0.55, peak: 0.06 },
    link: { f: 280, type: 'sine', dur: 0.35, peak: 0.05 },
    oracle: { f: 220, type: 'sine', dur: 0.45, peak: 0.05 },
    seal: { f: 160, type: 'triangle', dur: 0.3, peak: 0.05 },
    whoosh: { f: 180, type: 'sine', dur: 0.25, peak: 0.035 },
    success: { f: 440, type: 'sine', dur: 0.28, peak: 0.045 },
  };

  const s = table[kind];
  osc.type = s.type;
  osc.frequency.setValueAtTime(s.f, t0);
  if (kind === 'cherish') osc.frequency.exponentialRampToValueAtTime(520, t0 + s.dur);
  if (kind === 'link') osc.frequency.exponentialRampToValueAtTime(360, t0 + s.dur * 0.5);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(s.peak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + s.dur);
  osc.start(t0);
  osc.stop(t0 + s.dur + 0.02);
}
