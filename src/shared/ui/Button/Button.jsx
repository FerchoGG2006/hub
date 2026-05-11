import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-250 cubic-bezier(0.16, 1, 0.3, 1) active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)] hover:shadow-[var(--shadow-brand)]",
    secondary: "bg-transparent text-[var(--text-muted)] border-1.5 border-[var(--border-soft)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--border-soft)] hover:text-[var(--text-primary)]",
    accent: "bg-[var(--brand-accent)] text-white hover:brightness-110",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-xs rounded-[var(--radius-md)]",
    md: "px-6 py-3 text-sm rounded-[var(--radius-xl)]",
    lg: "px-8 py-4 text-base rounded-[var(--radius-xl)]",
    pill: "px-6 py-3 text-sm rounded-[var(--radius-pill)]",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Procesando...
        </span>
      ) : children}
    </motion.button>
  );
};
