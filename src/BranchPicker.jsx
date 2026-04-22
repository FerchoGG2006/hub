import React from 'react';
import { motion } from 'framer-motion';

export const BranchPicker = ({ branches, onSelect, brandName, branding }) => {
  return (
    <div className="min-h-svh w-full flex flex-col items-center justify-center bg-[#050505] px-6 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20" style={{ background: branding.brand_color || '#f59e0b' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
          {brandName}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
          Selecciona tu sede preferida
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm relative z-10">
        {branches.map((branch, idx) => (
          <motion.button
            key={branch.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(branch)}
            whileTap={{ scale: 0.97 }}
            className="group relative bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] text-left hover:bg-white/[0.08] transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">
                  {branch.name}
                </h3>
                <p className="text-xs text-white/40 font-light italic">
                  {branch.address}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </div>
            {/* HUD element */}
            <div className="absolute top-4 right-4 flex gap-1">
               <span className="w-1 h-3 bg-amber-500/20 rounded-full"></span>
               <span className="w-1 h-3 bg-amber-500/40 rounded-full"></span>
            </div>
          </motion.button>
        ))}
      </div>

      <footer className="mt-16 text-center opacity-20 relative z-10">
        <p className="text-[8px] uppercase tracking-[0.5em] text-white font-black">
          HUB Operativo v2.0
        </p>
      </footer>
    </div>
  );
};
