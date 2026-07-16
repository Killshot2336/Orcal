import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPASS_POINTS, ORACLE_TOPICS } from '../lib/constants';
import { askOracle } from '../lib/oracle';
import type { OracleTopic } from '../lib/types';
import { useSanctuary } from '../hooks/SanctuaryContext';

export function OraclePage() {
  const { state, setOracleResult } = useSanctuary();
  const [topic, setTopic] = useState<OracleTopic>('deep_connection');
  const [intensity, setIntensity] = useState(5);
  const [compass, setCompass] = useState('Openness');
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [source, setSource] = useState<'api' | 'offline' | null>(null);

  const topicMeta = useMemo(() => ORACLE_TOPICS.find((t) => t.id === topic)!, [topic]);

  async function consult() {
    setBusy(true);
    try {
      const res = await askOracle({
        bondId: state.bondId || 'local-bond',
        topic,
        intensity,
        compass,
        recentVowSummaries: state.vows.slice(0, 3).map((v) => v.text),
      });
      setOracleResult(res.question, res.tone);
      setFollowUps(res.followUps);
      setSource(res.source);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: '0 auto' }}>
      <Link to="/" className="back-link">
        ← Sanctuary
      </Link>
      <h1 className="title">Oracle’s Chamber</h1>
      <p className="muted">Topic Tapestry · Intensity · Compass — then ask.</p>

      {/* Topic Tapestry */}
      <section className="panel" style={{ marginTop: '1.25rem' }}>
        <h2 className="title" style={{ fontSize: '1.4rem' }}>
          Topic Tapestry
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
            marginTop: '1rem',
          }}
        >
          {ORACLE_TOPICS.map((t) => {
            const active = topic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.9rem',
                  borderRadius: 14,
                  border: `1px solid ${active ? 'var(--gold)' : 'rgba(185,169,146,0.3)'}`,
                  background: active
                    ? `hsla(${t.hue}, 35%, 28%, 0.55)`
                    : 'rgba(20,28,26,0.35)',
                }}
              >
                <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                  {t.label}
                </strong>
                <div className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
                  {t.blurb}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
          marginTop: 14,
        }}
      >
        {/* Intensity Slider */}
        <section className="panel">
          <h2 className="title" style={{ fontSize: '1.4rem' }}>
            Intensity
          </h2>
          <p className="muted">How deep should the Oracle reach? {intensity}/10</p>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--amber)', marginTop: '1rem' }}
            aria-label="Question intensity"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
            <span>Soft</span>
            <span>Deep</span>
          </div>
        </section>

        {/* Compass */}
        <section className="panel">
          <h2 className="title" style={{ fontSize: '1.4rem' }}>
            Compass
          </h2>
          <p className="muted">Steer the emotional north of this question.</p>
          <div
            style={{
              position: 'relative',
              width: 200,
              height: 200,
              margin: '1rem auto 0',
              borderRadius: '50%',
              border: '1px solid rgba(230,196,138,0.35)',
            }}
          >
            {COMPASS_POINTS.map((p) => {
              const rad = ((p.angle - 90) * Math.PI) / 180;
              const x = 100 + Math.cos(rad) * 72;
              const y = 100 + Math.sin(rad) * 72;
              const active = compass === p.label;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCompass(p.label)}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    padding: '0.35rem 0.55rem',
                    borderRadius: 10,
                    background: active ? 'var(--amber)' : 'rgba(42,56,51,0.9)',
                    color: active ? 'var(--bg-deep)' : 'var(--ink)',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(230,196,138,0.35)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
            <div
              style={{
                position: 'absolute',
                inset: '42%',
                borderRadius: '50%',
                background: 'var(--gold)',
                opacity: 0.85,
              }}
            />
          </div>
        </section>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <button className="cta" type="button" disabled={busy} onClick={() => void consult()}>
          {busy ? 'Listening…' : `Consult · ${topicMeta.label}`}
        </button>
      </div>

      <motion.section
        className="panel"
        style={{ marginTop: '1.25rem', minHeight: 160 }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        key={state.lastOracleQuestion ?? 'empty'}
      >
        {state.lastOracleTone ? (
          <p className="muted">
            Tone · {state.lastOracleTone}
            {source ? ` · via ${source}` : ''}
          </p>
        ) : null}
        <p className="plaque">
          {state.lastOracleQuestion ??
            'The chamber is quiet. Choose a topic, set intensity and compass, then ask.'}
        </p>
        {followUps.map((f) => (
          <p key={f} className="muted" style={{ marginTop: 8 }}>
            · {f}
          </p>
        ))}
      </motion.section>
    </main>
  );
}
