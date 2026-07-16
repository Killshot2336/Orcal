import { AnimatePresence, motion } from 'framer-motion';

/** Flowering vine bloom that wraps the viewport when a vow is cherished. */
export function CherishBloom({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="bloom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.path
                key={i}
                d={
                  i === 0
                    ? 'M 50 110 C 40 70, 20 55, 10 20'
                    : i === 1
                      ? 'M 50 110 C 60 65, 80 50, 92 18'
                      : i === 2
                        ? 'M 50 110 C 30 80, 15 40, 25 5'
                        : 'M 50 110 C 70 75, 88 35, 78 8'
                }
                fill="none"
                stroke="rgba(230,196,138,0.65)"
                strokeWidth="0.35"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.6, delay: i * 0.08, ease: 'easeInOut' }}
              />
            ))}
          </svg>
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={`f-${i}`}
              initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 0],
                rotate: i * 40,
              }}
              transition={{ duration: 1.5, delay: 0.15 + i * 0.05 }}
              style={{
                position: 'absolute',
                left: `${30 + (i % 4) * 15}%`,
                top: `${25 + Math.floor(i / 4) * 30}%`,
                width: 28,
                height: 28,
                borderRadius: '50% 0 50% 50%',
                background:
                  i % 2 === 0
                    ? 'radial-gradient(circle at 30% 30%, #e6c48a, #c4786a)'
                    : 'radial-gradient(circle at 30% 30%, #d4a574, #7f9f8a)',
                boxShadow: '0 0 18px rgba(230,196,138,0.45)',
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 1.4 }}
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 60%, rgba(230,196,138,0.35), transparent 55%)',
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
