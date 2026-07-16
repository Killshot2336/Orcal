import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChamberAtmosphere, type AtmosphereKind } from './ChamberAtmosphere';
import { PageTransition } from './PageTransition';
import { playChamberAmbient, unlockAudio } from '../lib/soundscape';

const AMBIENT_MAP = {
  nebula: 'home',
  stars: 'oracle',
  loom: 'loom',
  vault: 'vault',
  ember: 'home',
  dream: 'dreams',
  temple: 'temple',
} as const;

export function ChamberShell({
  title,
  subtitle,
  atmosphere,
  chamberKey,
  children,
  ambientOverride,
}: {
  title: string;
  subtitle?: string;
  atmosphere: AtmosphereKind;
  chamberKey: string;
  children: React.ReactNode;
  ambientOverride?: 'vow' | 'link' | 'observatory' | 'onboarding' | 'pin' | 'home' | 'oracle' | 'loom' | 'vault' | 'dreams' | 'temple';
}) {
  useEffect(() => {
    const ambient = ambientOverride ?? AMBIENT_MAP[atmosphere];
    void unlockAudio().then(() => playChamberAmbient(ambient));
  }, [atmosphere, ambientOverride]);

  return (
    <>
      <ChamberAtmosphere kind={atmosphere} />
      <PageTransition chamberKey={chamberKey}>
        <main style={{ maxWidth: 920, margin: '0 auto' }}>
          <Link to="/" className="back-link" onClick={() => void unlockAudio()}>
            ← Sanctuary
          </Link>
          <h1 className="title cinematic-title">{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
          {children}
        </main>
      </PageTransition>
    </>
  );
}
