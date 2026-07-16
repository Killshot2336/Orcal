import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { VowType } from '../lib/types';

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
  const [flash, setFlash] = useState(false);

  function place() {
    if (!text.trim()) return;
    addVow(type, text);
    setText('');
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link to="/" className="back-link">
        ← Sanctuary
      </Link>
      <h1 className="title">Vow Wall</h1>
      <p className="muted">A hallway of glowing plaques — Daily, Sacred, Desire.</p>

      {flash ? (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          onAnimationComplete={() => setFlash(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(230,196,138,0.25)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      ) : null}

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
          <div className="panel" style={{ minWidth: 280 }}>
            <p className="plaque">The hallway waits for your first vow.</p>
          </div>
        ) : (
          state.vows.map((vow, i) => (
            <motion.article
              key={vow.id}
              className="panel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                minWidth: 280,
                maxWidth: 320,
                scrollSnapAlign: 'center',
                borderColor: COLORS[vow.type],
                transform: `perspective(800px) rotateY(${i % 2 === 0 ? -4 : 4}deg)`,
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
                  setFlash(true);
                }}
              >
                Cherish · {vow.cherishCount}
              </button>
            </motion.article>
          ))
        )}
      </div>

      <section className="panel" style={{ marginTop: '1rem' }}>
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
    </main>
  );
}
