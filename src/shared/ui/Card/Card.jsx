import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', animate = true, ...props }) => {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={`bg-white border border-[var(--border-soft)] rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] p-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
