import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-[var(--border-soft)] text-[var(--text-muted)]",
    success: "bg-[var(--status-ready)]/10 text-[var(--status-ready)]",
    warning: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]",
    error: "bg-[var(--status-error)]/10 text-[var(--status-error)]",
    brand: "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[9px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
