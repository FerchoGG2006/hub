import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--text-primary)]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-soft)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-medium)] overflow-hidden ${className}`}
          >
            <div className="flex justify-between items-center mb-8">
              {title && (
                <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h3>
              )}
              <button 
                onClick={onClose}
                className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cerrar
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
