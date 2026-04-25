import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
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
    <div className="relative flex flex-row bg-white/[0.04] rounded-[1.4rem] border border-white/5 overflow-hidden group active:scale-[0.98] transition-all">
      {/* 📸 ZONA FOTO */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        className="relative w-[85px] flex-shrink-0 overflow-hidden bg-zinc-900 border-r border-white/5 cursor-pointer"
      >
        {item.image_url || item.image ? (
          <img 
            src={item.image_url || item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-white/[0.02]">
            {item.emoji || '🍽️'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-[8px] text-white opacity-40 group-hover:opacity-100 transition-opacity">
          🔍
        </div>
      </div>

      {/* ✍️ ZONA TEXTO */}
      <div 
        onClick={handleAdd}
        className="p-3 flex flex-col flex-1 justify-between gap-0.5 overflow-hidden cursor-pointer"
      >
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-[10px] font-black text-white uppercase leading-tight tracking-wider break-words flex-1">
              {item.name}
            </h3>
            <span className="text-white font-mono text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10 whitespace-nowrap">
              {item.price}
            </span>
          </div>
          
          <p className="text-[9px] text-white/40 font-light leading-snug italic mt-1 line-clamp-2 pr-1">
            {item.description || "Especialidad del chef."}
          </p>
        </div>

        {/* Tags Smart & Feedback */}
        <div className="flex justify-between items-end mt-1.5">
          <div className="flex gap-1">
            {tags.map(t => (
              <span key={t.label} className="w-4 h-4 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[8px]">
                {t.icon}
              </span>
            ))}
          </div>
          
          <AnimatePresence>
            {added && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[10px] bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
