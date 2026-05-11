import React from 'react';

export const Heading = ({ children, level = 1, className = '', serif = false }) => {
  const Component = `h${level}`;
  
  const baseStyles = "tracking-tight text-[var(--text-primary)]";
  
  const levels = {
    1: "text-4xl md:text-5xl font-black leading-[1.05]",
    2: "text-3xl font-bold leading-[1.1]",
    3: "text-2xl font-bold leading-[1.2]",
    4: "text-xl font-bold leading-[1.3]",
  };

  const fonts = serif ? "font-[var(--font-serif)] italic" : "font-[var(--font-main)]";

  return (
    <Component className={`${baseStyles} ${levels[level]} ${fonts} ${className}`}>
      {children}
    </Component>
  );
};
