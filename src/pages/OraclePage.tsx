import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { COMPASS_POINTS, ORACLE_TOPICS } from '../lib/constants';
import { askOracle } from '../lib/oracle';
import type { OracleTopic } from '../lib/types';
import { useSanctuary } from '../hooks/SanctuaryContext';
import { haptic } from '../lib/haptics';
import { playSfx, unlockAudio } from '../lib/soundscape';

export function OraclePage() {
  const { state, setOracleResult, pushOracleRound, answerLastOracle } = useSanctuary();
  const [topic, setTopic] = useState<OracleTopic>('deep_connection');
  const [selected, setSelected] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [compass, setCompass] = useState('Openness');
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [source, setSource] = useState<'api' | 'mock' | null>(null);
  const [answer, setAnswer] = useState('');
  const [showRedirect, setShowRedirect] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [redirectNote, setRedirectNote] = useState<string | null>(null);

  const topicMeta = useMemo(() => ORACLE_TOPICS.find((t) => t.id === topic)!, [topic]);
  const history = state.oracleHistory ?? [];

  async function consult() {
    setBusy(true);
    void unlockAudio();
    void playSfx('oracle');
    haptic('oracle');
    try {
      const res = await askOracle({
        bondId: state.bondId || 'local-bond',
        topic,
        intensity,
        compass,
        recentVowSummaries: state.vows.slice(0, 3).map((v) => v.text),
        history: history.slice(-5),
        mode: 'question',
      });
      setOracleResult(res.question, res.tone);
      pushOracleRound({
        question: res.question,
        topic: res.topic,
        intensity,
        at: Date.now(),
      });
      setFollowUps(res.followUps);
      setSource(res.source);
      setRedirectNote(null);
    } finally {
      setBusy(false);
    }
  }

  async function redirect() {
    setBusy(true);
    void playSfx('whoosh');
    try {
      const res = await askOracle({
        bondId: state.bondId || 'local-bond',
        topic,
        intensity: Math.min(intensity, 4),
        compass: 'Safety',
        history: history.slice(-5),
        pauseReason,
        mode: 'redirect',
      });
      if (res.suggestedTopic) setTopic(res.suggestedTopic);
      setOracleResult(res.question, res.tone);
      pushOracleRound({
        question: res.question,
        topic: res.suggestedTopic ?? res.topic,
        intensity: Math.min(intensity, 4),
        at: Date.now(),
      });
      setFollowUps(res.followUps);
      setSource(res.source);
      setRedirectNote(res.suggestedTopicReason ?? null);
      setShowRedirect(false);
      setPauseReason('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ChamberShell
      title="Oracle’s Chamber"
      subtitle="Topic Tapestry · Intensity · Compass — living intelligence"
      atmosphere="stars"
      chamberKey="oracle"
      ambientOverride="oracle"
    >
      {/* Topic Tapestry — floating icons */}
      <section className="panel glass" style={{ marginTop: '1.25rem', overflow: 'hidden' }}>
        <h2 className="title" style={{ fontSize: '1.4rem' }}>
          Topic Tapestry
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginTop: '1rem',
            minHeight: selected ? 120 : undefined,
          }}
        >
          <AnimatePresence>
            {ORACLE_TOPICS.map((t, i) => {
              if (selected && t.id !== topic) return null;
              const active = topic === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: [0, -6, 0],
                    scale: selected && active ? 1.04 : 1,
                  }}
                  exit={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, scale: 0.9 }}
                  transition={{
                    y: { duration: 4 + i * 0.35, repeat: Infinity, ease: 'easeInOut' },
                    layout: { duration: 0.55 },
                    exit: { duration: 0.45 },
                  }}
                  onClick={() => {
                    setTopic(t.id);
                    setSelected(true);
                    void playSfx('tap');
                    haptic('tap');
                  }}
                  style={{
                    textAlign: 'left',
                    padding: selected && active ? '1.4rem' : '0.95rem',
                    borderRadius: 16,
                    border: `1px solid ${active ? 'var(--gold)' : 'rgba(185,169,146,0.28)'}`,
                    background: active
                      ? `hsla(${t.hue}, 35%, 22%, 0.72)`
                      : 'rgba(20,28,26,0.4)',
                    boxShadow: active ? '0 0 28px rgba(230,196,138,0.2)' : 'none',
                    gridColumn: selected && active ? '1 / -1' : undefined,
                  }}
                >
                  <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: selected ? '1.5rem' : '1.1rem' }}>
                    {t.label}
                  </strong>
                  <div className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
                    {t.blurb}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        {selected ? (
          <button
            className="cta secondary"
            type="button"
            style={{ marginTop: 12 }}
            onClick={() => setSelected(false)}
          >
            Show full tapestry
          </button>
        ) : null}
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
          marginTop: 14,
        }}
      >
        <section className="panel glass">
          <h2 className="title" style={{ fontSize: '1.35rem' }}>
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

        <section className="panel glass">
          <h2 className="title" style={{ fontSize: '1.35rem' }}>
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
              background:
                'radial-gradient(circle at 50% 50%, rgba(230,196,138,0.08), transparent 60%)',
            }}
          >
            {COMPASS_POINTS.map((p) => {
              const rad = ((p.angle - 90) * Math.PI) / 180;
              const x = 100 + Math.cos(rad) * 72;
              const y = 100 + Math.sin(rad) * 72;
              const active = compass === p.label;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  onClick={() => {
                    setCompass(p.label);
                    void playSfx('tap');
                  }}
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
                </motion.button>
              );
            })}
            <div
              style={{
                position: 'absolute',
                inset: '42%',
                borderRadius: '50%',
                background: 'var(--gold)',
                opacity: 0.85,
                boxShadow: '0 0 20px rgba(230,196,138,0.45)',
              }}
            />
          </div>
        </section>
      </div>

      <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button className="cta" type="button" disabled={busy} onClick={() => void consult()}>
          {busy ? 'Listening…' : `Consult · ${topicMeta.label}`}
        </button>
        <button
          className="cta secondary"
          type="button"
          onClick={() => setShowRedirect((v) => !v)}
        >
          Let’s Redirect This Question
        </button>
      </div>

      {showRedirect ? (
        <motion.section
          className="panel glass"
          style={{ marginTop: 12 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="muted">
            Tell the Oracle why this pause is needed — it will suggest a kinder path.
          </p>
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="pause">Reason (optional)</label>
            <input
              id="pause"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="e.g. feeling insecure, tired, overwhelmed…"
            />
          </div>
          <button className="cta" type="button" disabled={busy} onClick={() => void redirect()}>
            Ask for redirection
          </button>
        </motion.section>
      ) : null}

      <motion.section
        className="panel glass"
        style={{ marginTop: '1.25rem', minHeight: 160 }}
        key={state.lastOracleQuestion ?? 'empty'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {state.lastOracleTone ? (
          <p className="muted">
            Tone · {state.lastOracleTone}
            {source ? ` · via ${source}` : ''}
            {history.length ? ` · context ${Math.min(5, history.length)} rounds` : ''}
          </p>
        ) : null}
        {redirectNote ? (
          <p className="muted" style={{ color: 'var(--sage)' }}>
            {redirectNote}
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
        {state.lastOracleQuestion ? (
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="answer">Your answer (feeds the next question)</label>
            <textarea
              id="answer"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Speak gently into the chamber…"
            />
            <button
              className="cta secondary"
              type="button"
              style={{ marginTop: 8 }}
              onClick={() => {
                if (!answer.trim()) return;
                answerLastOracle(answer);
                setAnswer('');
                void playSfx('success');
                haptic('success');
              }}
            >
              Seal answer into memory
            </button>
          </div>
        ) : null}
      </motion.section>
    </ChamberShell>
  );
}
