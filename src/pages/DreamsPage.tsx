import { useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { useSanctuary } from '../hooks/SanctuaryContext';
import { playSfx } from '../lib/soundscape';

export function DreamsPage() {
  const { state, addDream } = useSanctuary();
  const [text, setText] = useState('');

  const themeCounts = new Map<string, number>();
  for (const d of state.dreams) {
    for (const t of d.themes) themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
  }
  const shared = [...themeCounts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([t]) => t);

  return (
    <ChamberShell
      title="Slumber Room"
      subtitle={
        shared.length
          ? `Shared themes: ${shared.join(', ')}`
          : 'Awaiting a shared dream constellation.'
      }
      atmosphere="dream"
      chamberKey="dreams"
    >
      <div style={{ display: 'grid', gap: 12, margin: '1.25rem 0' }}>
        {state.dreams.length === 0 ? (
          <div className="panel glass">
            <p className="plaque">Night is unwritten. Offer a dream fragment.</p>
          </div>
        ) : (
          state.dreams.map((d) => (
            <article key={d.id} className="panel glass">
              <p>{d.text}</p>
              <p className="muted">Themes · {d.themes.join(', ') || 'drifting'}</p>
            </article>
          ))
        )}
      </div>

      <section className="panel glass">
        <div className="field">
          <label htmlFor="dream">Transcribe a dream</label>
          <textarea
            id="dream"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="We walked through a moonlit forest…"
          />
        </div>
        <button
          className="cta"
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            addDream(text);
            setText('');
            void playSfx('seal');
          }}
        >
          Weave into Night
        </button>
      </section>
    </ChamberShell>
  );
}
