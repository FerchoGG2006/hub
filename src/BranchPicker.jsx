import React from 'react';
import { motion } from 'framer-motion';

export const BranchPicker = ({ branches, onSelect, brandName, branding }) => {
  return (
    <div className="min-h-svh w-full flex flex-col items-center justify-center bg-[#050505] px-6 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: branding.brand_color || '#f59e0b' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 text-center mb-12"
      >
        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
          {brandName}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black">
          Selecciona tu sede preferida
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 w-full max-w-sm relative z-30">
        {branches.map((branch, idx) => (
          <motion.button
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(branch)}
            whileTap={{ scale: 0.96 }}
            className="group relative bg-white/[0.04] border border-white/10 p-7 rounded-[2.5rem] text-left hover:bg-white/[0.08] transition-all hover:border-amber-500/30 cursor-pointer pointer-events-auto"
          >
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-xl font-black text-white mb-1 transition-colors group-hover:text-amber-500">
                  {branch.name}
                </h3>
                <p className="text-xs text-white/30 font-light italic tracking-tight">
                  {branch.address || 'Ubicación Premium'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500">
                <span className="text-xl">→</span>
              </div>
            </div>
            
            {/* Gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          </motion.button>
        ))}
      </div>

      <footer className="mt-20 text-center opacity-10 relative z-10 pointer-events-none">
        <p className="text-[9px] uppercase tracking-[0.8em] text-white font-black">
          HUB Operativo — La Rivera
        </p>
      </footer>
    </div>
  );
};
