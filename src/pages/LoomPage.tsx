import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { MemoryKind } from '../lib/types';

const KINDS: MemoryKind[] = ['photo', 'voice', 'screenshot', 'video'];
const COLORS: Record<MemoryKind, string> = {
  photo: '#d4a574',
  voice: '#7f9f8a',
  screenshot: '#c4786a',
  video: '#8ba7c4',
};

export function LoomPage() {
  const { state, addMemory } = useSanctuary();
  const [status, setStatus] = useState('Touch a thread type to weave');

  const nodes = useMemo(() => {
    if (!state.memories.length) {
      return Array.from({ length: 6 }).map((_, i) => ({
        id: `g-${i}`,
        x: 40 + (i % 3) * 100,
        y: 50 + Math.floor(i / 3) * 110,
        color: 'rgba(185,169,146,0.25)',
      }));
    }
    return state.memories.map((m) => ({
      id: m.id,
      x: 36 + m.x * 260,
      y: 40 + m.y * 240,
      color: COLORS[m.kind],
    }));
  }, [state.memories]);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/" className="back-link">
        ← Sanctuary
      </Link>
      <h1 className="title">The Loom</h1>
      <p className="muted">{status}</p>

      <div className="panel" style={{ margin: '1.25rem 0', padding: 0, overflow: 'hidden' }}>
        <svg viewBox="0 0 340 320" width="100%" height="340" role="img" aria-label="Memory tapestry">
          {nodes.map((a, i) =>
            nodes.slice(i + 1).map((b) => (
              <path
                key={`${a.id}-${b.id}`}
                d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 28} ${b.x} ${b.y}`}
                stroke={a.color}
                strokeWidth="1.4"
                fill="none"
                opacity="0.55"
              />
            )),
          )}
          {nodes.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r="8" fill={n.color} />
          ))}
        </svg>
      </div>

      <div className="chip-row">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="chip active"
            style={{ borderColor: COLORS[kind], color: COLORS[kind] }}
            onClick={() => {
              addMemory(kind, `${kind} woven at ${new Date().toLocaleTimeString()}`);
              setStatus(`Wove a ${kind} into the tapestry`);
            }}
          >
            Weave {kind}
          </button>
        ))}
      </div>

      <ul className="muted" style={{ marginTop: '1.5rem', paddingLeft: '1.1rem' }}>
        {state.memories.slice(0, 8).map((m) => (
          <li key={m.id}>
            {m.kind} — {m.caption}
          </li>
        ))}
      </ul>
    </main>
  );
}
