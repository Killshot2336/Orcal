import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChamberAtmosphere } from '../components/ChamberAtmosphere';
import { PageTransition } from '../components/PageTransition';
import { useSanctuary } from '../hooks/SanctuaryContext';
import { playChamberAmbient, playSfx, unlockAudio } from '../lib/soundscape';
import { haptic } from '../lib/haptics';

export function PinPage() {
  const { state, setPin, unlock } = useSanctuary();
  const navigate = useNavigate();
  const [digits, setDigits] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void unlockAudio().then(() => playChamberAmbient('pin'));
  }, []);

  const mode = !state.pin ? (confirm === null ? 'create' : 'confirm') : 'unlock';
  const title = useMemo(() => {
    if (mode === 'create') return 'Create your Sanctuary PIN';
    if (mode === 'confirm') return 'Confirm the PIN';
    return 'Enter Sanctuary';
  }, [mode]);

  if (!state.pactAccepted) return <Navigate to="/onboarding" replace />;
  if (state.unlocked) return <Navigate to="/" replace />;

  function press(d: string) {
    setError('');
    void playSfx('tap');
    haptic('tap');
    setDigits((digits + d).slice(0, 6));
  }

  function submit() {
    if (digits.length < 4) {
      setError('Use 4–6 digits.');
      return;
    }
    if (mode === 'create') {
      setConfirm(digits);
      setDigits('');
      return;
    }
    if (mode === 'confirm') {
      if (digits !== confirm) {
        setError('Pins do not match. Breathe, try again.');
        setConfirm(null);
        setDigits('');
        return;
      }
      setPin(digits);
      void playSfx('success');
      haptic('success');
      navigate('/');
      return;
    }
    if (!unlock(digits)) {
      setError('That pin does not open this door.');
      setDigits('');
      return;
    }
    void playSfx('success');
    haptic('success');
    navigate('/');
  }

  return (
    <>
      <ChamberAtmosphere kind="ember" intensity={0.7} />
      <PageTransition chamberKey="pin">
        <main style={{ maxWidth: 420, margin: '0 auto', paddingTop: '8vh', textAlign: 'center' }}>
          <h1 className="brand cinematic-title" style={{ fontSize: '2.8rem' }}>
            Sanctuary
          </h1>
          <h2 className="title">{title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '1.5rem 0' }}>
            {Array.from({ length: Math.max(4, digits.length || 4) }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '1px solid var(--ink-muted)',
                  background: i < digits.length ? 'var(--amber)' : 'transparent',
                  boxShadow: i < digits.length ? '0 0 10px rgba(212,165,116,0.55)' : 'none',
                }}
              />
            ))}
          </div>
          {error ? <p className="error">{error}</p> : null}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              maxWidth: 300,
              margin: '1.5rem auto',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '→'].map((key) => (
              <button
                key={key}
                type="button"
                className="panel glass"
                style={{ padding: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}
                onClick={() => {
                  if (key === '⌫') setDigits((d) => d.slice(0, -1));
                  else if (key === '→') submit();
                  else press(key);
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </main>
      </PageTransition>
    </>
  );
}
