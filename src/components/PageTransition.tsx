import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const variants = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(4px)' },
};

/** Parallax-flavored page enter — layers drift at different speeds via children offsets. */
export function PageTransition({
  children,
  chamberKey,
}: {
  children: ReactNode;
  chamberKey: string;
}) {
  return (
    <motion.div
      key={chamberKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <motion.div
        initial={{ y: 18 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
