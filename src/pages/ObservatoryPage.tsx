import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSanctuary } from '../hooks/SanctuaryContext';

export function ObservatoryPage() {
  const { state } = useSanctuary();

  const stars = useMemo(() => {
    const metrics = [
      { name: 'vows', n: state.vows.length, color: 'var(--gold)' },
      { name: 'memories', n: state.memories.length, color: 'var(--amber)' },
      { name: 'dreams', n: state.dreams.length, color: 'var(--sage)' },
      { name: 'vault', n: state.vault.length, color: 'var(--rose)' },
      { name: 'links', n: state.links.length, color: '#8ba7c4' },
      { name: 'heartbeat', n: Math.round(state.heartbeat / 10), color: 'var(--ink)' },
    ];
    return metrics.flatMap((m, mi) =>
      Array.from({ length: Math.max(1, Math.min(8, m.n || 1)) }).map((_, i) => {
        const angle = ((mi * 60 + i * 24) * Math.PI) / 180;
        const radius = 40 + i * 16 + mi * 5;
        return {
          id: `${m.name}-${i}`,
          x: 160 + Math.cos(angle) * radius,
          y: 160 + Math.sin(angle) * radius,
          r: 2 + (i % 3),
          color: m.color,
        };
      }),
    );
  }, [state]);

  const links = useMemo(() => {
    const out: Array<[ (typeof stars)[0], (typeof stars)[0] ]> = [];
    for (let i = 0; i < stars.length - 1; i += 1) {
      if (i % 2 === 0) out.push([stars[i]!, stars[i + 1]!]);
    }
    return out;
  }, [stars]);

  return (
    <main style={{ maxWidth: 820, margin: '0 auto' }}>
      <Link to="/" className="back-link">
        ← Sanctuary
      </Link>
      <h1 className="title">The Observatory</h1>
      <p className="muted">
        Constellations from lived devotion · heartbeat {state.heartbeat}
      </p>

      <motion.div
        className="panel"
        style={{ marginTop: '1.25rem', borderRadius: 999, overflow: 'hidden', padding: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 320 320" width="100%" height="360" role="img" aria-label="Star map">
          <circle
            cx="160"
            cy="160"
            r="120"
            stroke="rgba(230,196,138,0.15)"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="160"
            cy="160"
            r="70"
            stroke="rgba(127,159,138,0.2)"
            strokeWidth="1"
            fill="none"
          />
          {links.map(([a, b], i) => (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(212,165,116,0.35)"
              strokeWidth="1"
            />
          ))}
          {stars.map((s) => (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill={s.color} />
          ))}
        </svg>
      </motion.div>

      <p style={{ marginTop: '1.25rem' }}>
        Your sky holds {stars.length} stars across vows, memories, dreams, vault trust, links, and
        pulse.
      </p>
    </main>
  );
}
