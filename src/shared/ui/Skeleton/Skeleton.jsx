import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton = ({ width = '100%', height = '1rem', className = '' }) => {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] ${className}`}
      style={{ width, height }}
    />
  );
};
