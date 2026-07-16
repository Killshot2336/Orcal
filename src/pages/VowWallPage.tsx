import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { CherishBloom } from '../components/CherishBloom';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { VowType } from '../lib/types';
import { haptic } from '../lib/haptics';
import { playSfx } from '../lib/soundscape';

const TYPES: VowType[] = ['daily', 'sacred', 'desire'];
const COLORS: Record<VowType, string> = {
  daily: 'var(--sage)',
  sacred: 'var(--gold)',
  desire: 'var(--rose)',
};

export function VowWallPage() {
  const { state, addVow, cherishVow } = useSanctuary();
  const [type, setType] = useState<VowType>('sacred');
  const [text, setText] = useState('');
  const [bloom, setBloom] = useState(false);

  function place() {
    if (!text.trim()) return;
    addVow(type, text);
    setText('');
    void playSfx('seal');
    haptic('success');
  }

  return (
    <>
      <CherishBloom active={bloom} />
      <ChamberShell
        title="Vow Wall"
        subtitle="A hallway of glowing plaques — Daily, Sacred, Desire."
        atmosphere="ember"
        chamberKey="vow"
        ambientOverride="vow"
      >
        <div
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            padding: '1.5rem 0.25rem 1rem',
            scrollSnapType: 'x mandatory',
          }}
        >
          {state.vows.length === 0 ? (
            <div className="panel glass" style={{ minWidth: 280 }}>
              <p className="plaque">The hallway waits for your first vow.</p>
            </div>
          ) : (
            state.vows.map((vow, i) => (
              <motion.article
                key={vow.id}
                className="panel glass"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  minWidth: 280,
                  maxWidth: 320,
                  scrollSnapAlign: 'center',
                  borderColor: COLORS[vow.type],
                  transform: `perspective(800px) rotateY(${i % 2 === 0 ? -5 : 5}deg)`,
                }}
              >
                <p className="muted" style={{ color: COLORS[vow.type], textTransform: 'uppercase' }}>
                  {vow.type}
                </p>
                <p className="plaque">{vow.text}</p>
                <button
                  className="cta secondary"
                  type="button"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    cherishVow(vow.id);
                    setBloom(true);
                    void playSfx('cherish');
                    haptic('cherish');
                    window.setTimeout(() => setBloom(false), 1700);
                  }}
                >
                  Cherish · {vow.cherishCount}
                </button>
              </motion.article>
            ))
          )}
        </div>

        <section className="panel glass" style={{ marginTop: '1rem' }}>
          <div className="chip-row" style={{ marginBottom: '1rem' }}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${type === t ? 'active' : ''}`}
                onClick={() => setType(t)}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="vow">Speak a vow</label>
            <textarea
              id="vow"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I vow to…"
            />
          </div>
          <button className="cta" type="button" onClick={place}>
            Place Plaque
          </button>
        </section>
      </ChamberShell>
    </>
  );
}
