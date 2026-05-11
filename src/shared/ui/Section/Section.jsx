import React from 'react';

export const Section = ({ children, className = '', container = true }) => {
  return (
    <section className={`py-12 md:py-20 ${className}`}>
      {container ? (
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          {children}
        </div>
      ) : children}
    </section>
  );
};
