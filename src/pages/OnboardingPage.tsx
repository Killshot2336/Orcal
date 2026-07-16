import { motion } from 'framer-motion';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { SACRED_PACT_TEXT } from '../lib/constants';
import { useSanctuary } from '../hooks/SanctuaryContext';

export function OnboardingPage() {
  const { state, acceptPact } = useSanctuary();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'vow' | 'names'>('intro');
  const [displayName, setDisplayName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [error, setError] = useState('');

  if (state.pactAccepted && state.unlocked) return <Navigate to="/" replace />;
  if (state.pactAccepted && !state.unlocked) return <Navigate to="/pin" replace />;

  function seal() {
    if (!displayName.trim()) {
      setError('Offer your name to the pact.');
      return;
    }
    acceptPact(displayName, partnerName);
    navigate('/pin');
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', paddingTop: '10vh' }}>
      {phase === 'intro' && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="brand"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            Sanctuary
          </motion.h1>
          <p className="plaque muted" style={{ maxWidth: 420, margin: '1rem 0 2rem' }}>
            A private sacred space for two. Encrypted in devotion. No ads. No outside eyes.
          </p>
          <button className="cta" type="button" onClick={() => setPhase('vow')}>
            Enter the Pact
          </button>
        </motion.section>
      )}

      {phase === 'vow' && (
        <motion.section
          className="panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="title">The Sacred Pact</h2>
          <p className="plaque" style={{ whiteSpace: 'pre-line', margin: '1.25rem 0 1.75rem' }}>
            {SACRED_PACT_TEXT}
          </p>
          <button className="cta" type="button" onClick={() => setPhase('names')}>
            We Accept Together
          </button>
        </motion.section>
      )}

      {phase === 'names' && (
        <motion.section
          className="panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="title">Name the Bond</h2>
          <p className="muted">No traditional login — next you create a private PIN.</p>
          <div className="field" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="you">Your name</label>
            <input
              id="you"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
            />
          </div>
          <div className="field">
            <label htmlFor="partner">Partner’s name</label>
            <input
              id="partner"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="cta" type="button" onClick={seal}>
            Seal & Continue
          </button>
        </motion.section>
      )}
    </main>
  );
}
