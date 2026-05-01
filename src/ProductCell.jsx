import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductCell = ({ item, onAdd, onClick }) => {
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd?.(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const tags = [];
  const desc = (item.description || "").toLowerCase();
  if (desc.includes("picante") || desc.includes("chile")) tags.push({ icon: "🔥", label: "Picante" });
  if (desc.includes("vegano") || desc.includes("vegan")) tags.push({ icon: "🌱", label: "Vegano" });
  if (desc.includes("gluten free") || desc.includes("sin tacc")) tags.push({ icon: "🌾", label: "GF" });
  if (desc.includes("recomendado") || desc.includes("chef")) tags.push({ icon: "⭐", label: "Top" });

  return (
    <div className="relative flex flex-row bg-white/[0.02] hover:bg-white/[0.04] rounded-[1.6rem] border border-white/5 overflow-hidden group active:scale-[0.98] transition-all shadow-lg backdrop-blur-sm">
      {/* 📸 ZONA FOTO */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        className="relative w-[100px] flex-shrink-0 overflow-hidden bg-zinc-900/50 border-r border-white/5 cursor-pointer"
      >
        {item.image_url || item.image ? (
          <img 
            src={item.image_url || item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-white/[0.02] group-hover:scale-110 transition-transform">
            {item.emoji || '🍽️'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-black/40" />
        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10">
          🔍
        </div>
      </div>

      {/* ✍️ ZONA TEXTO */}
      <div 
        onClick={handleAdd}
        className="p-4 flex flex-col flex-1 justify-between gap-1.5 overflow-hidden cursor-pointer"
      >
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[11px] font-black text-white uppercase leading-tight tracking-wider break-words flex-1 group-hover:text-amber-500 transition-colors">
              {item.name}
            </h3>
            <span className="text-white font-mono text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 whitespace-nowrap shadow-sm">
              {item.price}
            </span>
          </div>
          
          <p className="text-[10px] text-white/30 font-light leading-relaxed italic mt-2 line-clamp-2 pr-2">
            {item.description || "Una especialidad diseñada por nuestro equipo gourmet."}
          </p>
        </div>

        {/* Tags Smart & Feedback */}
        <div className="flex justify-between items-end mt-2">
          <div className="flex gap-1.5">
            {tags.map(t => (
              <span key={t.label} className="w-5 h-5 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[10px] hover:bg-white/10 transition-colors" title={t.label}>
                {t.icon}
              </span>
            ))}
          </div>
          
          <AnimatePresence>
            {added && (
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="flex items-center gap-2 px-2.5 py-1 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                <span className="text-[8px] font-black uppercase text-black">Añadido</span>
                <span className="text-[10px] text-black">✓</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
