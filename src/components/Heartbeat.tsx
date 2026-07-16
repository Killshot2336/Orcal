import { motion, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';

/** Organic Heartbeat — smooth sine pulse with living texture. */
export function Heartbeat({ score, partnerName }: { score: number; partnerName: string }) {
  const [scale, setScale] = useState(1);
  const t0 = useRef(performance.now());
  // BPM-ish from score: higher vitality → slightly quicker but still smooth
  const period = Math.max(1.05, 2.1 - score / 95);

  useAnimationFrame((t) => {
    const elapsed = (t - t0.current) / 1000;
    const wave = Math.sin((elapsed * Math.PI * 2) / period);
    // asymmetric heartbeat: soft attack, slower release
    const shaped = wave > 0 ? wave * 0.085 : wave * 0.035;
    setScale(1 + shaped);
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        style={{
          width: 168,
          height: 168,
          margin: '0 auto 1rem',
          borderRadius: '50%',
          scale,
          border: '1px solid rgba(230,196,138,0.4)',
          background: `
            radial-gradient(circle at 35% 30%, rgba(243,232,216,0.25), transparent 45%),
            radial-gradient(circle at 60% 70%, rgba(196,120,106,0.55), transparent 55%),
            radial-gradient(circle at 50% 50%, #2a3833, #141c1a)
          `,
          boxShadow: `0 0 ${22 + score / 3}px rgba(212,165,116,${0.22 + score / 280}),
            inset 0 0 30px rgba(196,120,106,0.25)`,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35], rotate: [0, 8, 0] }}
          transition={{ duration: period * 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '18%',
            borderRadius: '50%',
            background:
              'conic-gradient(from 40deg, transparent, rgba(230,196,138,0.2), transparent 40%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 44, lineHeight: 1, color: '#c4786a' }}>♥</div>
          <div
            style={{
              color: 'var(--gold)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              marginTop: 4,
            }}
          >
            {score}
          </div>
        </div>
      </motion.div>
      <h2 className="title" style={{ fontSize: '1.85rem' }}>
        Heartbeat
      </h2>
      <p className="muted">woven with {partnerName}</p>
    </div>
  );
}
