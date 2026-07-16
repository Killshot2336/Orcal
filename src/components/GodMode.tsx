import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { askOracle } from '../lib/oracle';
import type { QaRound } from '../lib/oracle';
import type { OracleTopic } from '../lib/types';
import { playSfx } from '../lib/soundscape';

/** Hidden Analyst / God Mode — plain strategic counsel with the raw Oracle. */
export function GodMode({
  open,
  onClose,
  bondId,
  history,
}: {
  open: boolean;
  onClose: () => void;
  bondId: string;
  history: QaRound[];
}) {
  const [prompt, setPrompt] = useState('');
  const [log, setLog] = useState<Array<{ role: 'you' | 'oracle'; text: string }>>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!prompt.trim() || busy) return;
    const you = prompt.trim();
    setPrompt('');
    setLog((l) => [...l, { role: 'you', text: you }]);
    setBusy(true);
    void playSfx('oracle');
    try {
      const res = await askOracle({
        bondId,
        topic: 'deep_connection' as OracleTopic,
        intensity: 5,
        compass: 'Safety',
        history,
        mode: 'analyst',
        analystPrompt: you,
      });
      setLog((l) => [
        ...l,
        { role: 'oracle', text: res.analystReply || res.question },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(10,12,11,0.92)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="panel"
            style={{
              width: 'min(640px, 100%)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#121816',
              borderColor: 'rgba(230,196,138,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 className="title" style={{ fontSize: '1.4rem' }}>
                  God Mode · Analyst
                </h2>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Private strategic counsel. Paste conversations. Ask for guidance.
                </p>
              </div>
              <button className="cta secondary" type="button" onClick={onClose}>
                Close
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                margin: '1rem 0',
                display: 'grid',
                gap: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.88rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {log.length === 0 ? (
                <p className="muted">
                  The chamber is clear. Ask for a read on a conversation, a rupture, or a desire.
                </p>
              ) : (
                log.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 10,
                      background:
                        m.role === 'you' ? 'rgba(42,56,51,0.7)' : 'rgba(230,196,138,0.08)',
                      border: '1px solid rgba(230,196,138,0.15)',
                    }}
                  >
                    <strong style={{ color: 'var(--gold)' }}>
                      {m.role === 'you' ? 'You' : 'Oracle'}
                    </strong>
                    <div style={{ marginTop: 6 }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="field" style={{ marginBottom: 8 }}>
              <label htmlFor="god">Counsel request</label>
              <textarea
                id="god"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste a conversation or ask for strategic advice…"
              />
            </div>
            <button className="cta" type="button" disabled={busy} onClick={() => void send()}>
              {busy ? 'Listening…' : 'Ask Analyst'}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
