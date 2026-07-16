import { useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { askOracle } from '../lib/oracle';
import { useSanctuary } from '../hooks/SanctuaryContext';
import { playSfx } from '../lib/soundscape';
import { haptic } from '../lib/haptics';

const REGIONS = [
  { id: 'crown', label: 'Crown', x: 50, y: 8 },
  { id: 'throat', label: 'Throat', x: 50, y: 18 },
  { id: 'heart', label: 'Heart', x: 50, y: 32 },
  { id: 'hands', label: 'Hands', x: 18, y: 48 },
  { id: 'belly', label: 'Belly', x: 50, y: 45 },
  { id: 'hips', label: 'Hips', x: 50, y: 58 },
  { id: 'feet', label: 'Feet', x: 50, y: 90 },
];

export function TemplePage() {
  const { state, setOracleResult } = useSanctuary();
  const [region, setRegion] = useState<string | null>(null);
  const [question, setQuestion] = useState(
    'Touch the Temple with reverence. Curiosity is invitation, never demand.',
  );

  async function touch(label: string) {
    setRegion(label);
    void playSfx('oracle');
    haptic('tap');
    const res = await askOracle({
      bondId: state.bondId || 'local-bond',
      topic: 'naughty_exploration',
      intensity: 6,
      compass: 'Desire',
      history: state.oracleHistory?.slice(-5),
      recentVowSummaries: [`body region: ${label}`],
    });
    setQuestion(res.question);
    setOracleResult(res.question, res.tone);
  }

  return (
    <ChamberShell
      title="The Temple"
      subtitle={region ? `Region · ${region}` : 'Artistic silhouette · consent-first'}
      atmosphere="temple"
      chamberKey="temple"
    >
      <div
        style={{
          position: 'relative',
          width: 240,
          height: 440,
          margin: '1.5rem auto',
        }}
      >
        <svg viewBox="0 0 220 420" width="220" height="420" aria-hidden="true">
          <ellipse cx="110" cy="48" rx="28" ry="34" fill="rgba(243,232,216,0.18)" />
          <path
            d="M70 95 C70 80, 150 80, 150 95 L165 210 C168 250, 155 280, 145 300 L140 400 L80 400 L75 300 C65 280, 52 250, 55 210 Z"
            fill="rgba(243,232,216,0.12)"
            stroke="rgba(230,196,138,0.45)"
            strokeWidth="1.5"
          />
        </svg>
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-label={`Temple region ${r.label}`}
            onClick={() => void touch(r.label)}
            style={{
              position: 'absolute',
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              borderRadius: '50%',
              background: 'var(--gold)',
              border: 'none',
              boxShadow: '0 0 12px rgba(230,196,138,0.55)',
            }}
          />
        ))}
      </div>

      <section className="panel glass">
        <p className="plaque">{question}</p>
      </section>
    </ChamberShell>
  );
}
