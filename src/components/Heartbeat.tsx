import { motion } from 'framer-motion';

export function Heartbeat({ score, partnerName }: { score: number; partnerName: string }) {
  const duration = Math.max(0.55, 1.45 - score / 120);

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 160,
          height: 160,
          margin: '0 auto 1rem',
          borderRadius: '50%',
          border: '1px solid rgba(230,196,138,0.35)',
          background: 'rgba(42,56,51,0.85)',
          boxShadow: `0 0 ${20 + score / 3}px rgba(212,165,116,${0.2 + score / 250})`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 42, lineHeight: 1 }}>♥</div>
          <div style={{ color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.08em' }}>
            {score}
          </div>
        </div>
      </motion.div>
      <h2 className="title" style={{ fontSize: '1.8rem' }}>
        Heartbeat
      </h2>
      <p className="muted">woven with {partnerName}</p>
    </div>
  );
}
