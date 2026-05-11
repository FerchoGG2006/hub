import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message, type = 'success', onClose }) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const variants = {
    success: 'border-[var(--status-ready)]',
    error: 'border-[var(--status-error)]',
    info: 'border-[var(--brand-primary)]',
    warning: 'border-[var(--status-pending)]',
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed top-6 right-6 z-[2000] flex items-center gap-4 bg-white border-l-4 p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-medium)] ${variants[type]}`}
    >
      <span className="text-xl">{icons[type]}</span>
      <p className="text-sm font-semibold text-[var(--text-primary)] pr-8">
        {message}
      </p>
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        ✕
      </button>
    </motion.div>
  );
};
