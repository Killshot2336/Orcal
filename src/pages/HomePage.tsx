import { Link } from 'react-router-dom';
import { Heartbeat } from '../components/Heartbeat';
import { useSanctuary } from '../hooks/SanctuaryContext';

const NAV = [
  { to: '/vow-wall', title: 'Vow Wall', blurb: 'Glowing plaques of devotion' },
  { to: '/loom', title: 'The Loom', blurb: 'Memory tapestry' },
  { to: '/oracle', title: 'Oracle', blurb: 'Question game chamber' },
  { to: '/link', title: 'The Link', blurb: 'I’m thinking of you' },
  { to: '/vault', title: 'The Vault', blurb: 'Two-key trust space' },
  { to: '/observatory', title: 'Observatory', blurb: 'Constellations of care' },
  { to: '/dreams', title: 'Slumber', blurb: 'Shared dream themes' },
  { to: '/temple', title: 'Temple', blurb: 'Sacred body map' },
] as const;

export function HomePage() {
  const { state, lock, resetAll } = useSanctuary();

  return (
    <main style={{ maxWidth: 880, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="brand">Sanctuary</h1>
          <p className="muted">
            {state.displayName} · {state.partnerName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
          <button className="cta secondary" type="button" onClick={lock}>
            Lock
          </button>
          <button
            className="cta secondary"
            type="button"
            onClick={() => {
              if (confirm('Reset this Sanctuary on this browser?')) resetAll();
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <section style={{ margin: '2.5rem 0' }}>
        <Heartbeat score={state.heartbeat} partnerName={state.partnerName} />
      </section>

      <nav className="nav-grid" aria-label="Sanctuary chambers">
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className="nav-card">
            <strong>{item.title}</strong>
            <span className="muted">{item.blurb}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
