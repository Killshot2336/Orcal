import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChamberAtmosphere } from '../components/ChamberAtmosphere';
import { GodMode } from '../components/GodMode';
import { Heartbeat } from '../components/Heartbeat';
import { PageTransition } from '../components/PageTransition';
import { useSanctuary } from '../hooks/SanctuaryContext';
import { haptic } from '../lib/haptics';
import { playChamberAmbient, playSfx, unlockAudio } from '../lib/soundscape';

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
  const [godOpen, setGodOpen] = useState(false);
  const taps = useRef(0);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    void unlockAudio().then(() => playChamberAmbient('home'));
  }, []);

  function onBrandTap() {
    taps.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 1400);
    if (taps.current >= 5) {
      taps.current = 0;
      setGodOpen(true);
      void playSfx('oracle');
      haptic('oracle');
    }
  }

  return (
    <>
      <ChamberAtmosphere kind="nebula" intensity={1.15} />
      <PageTransition chamberKey="home">
        <main style={{ maxWidth: 880, margin: '0 auto' }}>
          <header
            style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
          >
            <div>
              <motion.h1
                className="brand cinematic-title"
                onClick={onBrandTap}
                whileTap={{ scale: 0.985 }}
                style={{ cursor: 'default', userSelect: 'none' }}
                title="Sanctuary"
              >
                Sanctuary
              </motion.h1>
              <p className="muted">
                {state.displayName} · {state.partnerName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
              <button
                className="cta secondary"
                type="button"
                onClick={() => {
                  void playSfx('tap');
                  lock();
                }}
              >
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
            {NAV.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.55 }}
              >
                <Link
                  to={item.to}
                  className="nav-card glass"
                  onClick={() => {
                    void unlockAudio();
                    void playSfx('whoosh');
                    haptic('tap');
                  }}
                >
                  <strong>{item.title}</strong>
                  <span className="muted">{item.blurb}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </main>
      </PageTransition>

      <GodMode
        open={godOpen}
        onClose={() => setGodOpen(false)}
        bondId={state.bondId || 'local-bond'}
        history={state.oracleHistory ?? []}
      />
    </>
  );
}
