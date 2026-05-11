import React from 'react';

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[var(--text-muted)] ml-2">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-[var(--radius-md)] px-5 py-4 text-sm outline-none focus:border-[var(--brand-accent)] transition-all placeholder:text-[var(--text-disabled)] text-[var(--text-primary)] ${error ? 'border-[var(--status-error)]' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-[10px] text-[var(--status-error)] ml-2 font-medium">
          {error}
        </span>
      )}
    </div>
  );
};
