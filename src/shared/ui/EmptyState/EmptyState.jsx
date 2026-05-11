import React from 'react';
import { motion } from 'framer-motion';

export const EmptyState = ({ 
  icon = "🔍", 
  title = "No hay datos", 
  description = "No encontramos información para mostrar en este momento.",
  actionLabel,
  onAction,
  className = "" 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-secondary)]/50 border border-dashed border-[var(--border-soft)] rounded-[var(--radius-lg)] ${className}`}
    >
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-[var(--shadow-soft)] mb-6 border border-[var(--border-soft)]">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2 border border-[var(--border-soft)] rounded-full text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-primary)] transition-all font-bold"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
