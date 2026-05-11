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
    <div className="relative flex flex-row bg-dark/[0.02] hover:bg-dark/[0.05] rounded-[1.4rem] border border-dark/5 overflow-hidden group active:scale-[0.98] transition-all shadow-sm">
      {/* 📸 IMAGEN — Más estrecha */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick(e);
        }}
        className="relative w-[72px] flex-shrink-0 overflow-hidden bg-dark/5 cursor-pointer"
      >
        {item.image_url || item.image ? (
          <img 
            src={item.image_url || item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-dark/[0.03] group-hover:scale-110 transition-transform">
            {item.emoji || '🍽️'}
          </div>
        )}
        {/* Fade suave hacia el contenido */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#fdfcf7]/40" />
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-bone/70 backdrop-blur-md flex items-center justify-center text-[8px] text-dark/40 opacity-0 group-hover:opacity-100 transition-all border border-dark/5">
          🔍
        </div>
      </div>

      {/* ✍️ CONTENIDO — Título + Descripción + Precio separado */}
      <div 
        onClick={handleAdd}
        className="flex-1 flex flex-col justify-between p-3 pl-3.5 overflow-hidden cursor-pointer min-w-0"
      >
        {/* Título + Tags */}
        <div>
          <h3 className="text-[11px] font-black text-dark uppercase leading-tight tracking-wide break-words group-hover:text-amber-600 transition-colors mb-1">
            {item.name}
          </h3>
          <p className="text-[9px] text-dark/35 font-light leading-relaxed italic line-clamp-2 pr-1">
            {item.description || "Especialidad de la casa."}
          </p>
        </div>

        {/* Precio + Tags — Fila inferior separada */}
        <div className="flex justify-between items-end mt-2.5 pt-2 border-t border-dark/[0.04]">
          <div className="flex gap-1">
            {tags.map(t => (
              <span key={t.label} className="w-4.5 h-4.5 flex items-center justify-center rounded-md bg-dark/[0.03] border border-dark/5 text-[9px]" title={t.label}>
                {t.icon}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <AnimatePresence>
              {added && (
                <motion.div initial={{ scale: 0, x: 10 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0, x: 10 }} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <span className="text-[7px] font-black uppercase text-white">Añadido</span>
                  <span className="text-[8px] text-white">✓</span>
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-dark font-mono text-[11px] font-black bg-dark/[0.04] px-2.5 py-1 rounded-lg border border-dark/[0.06] whitespace-nowrap">
              ${item.price?.toLocaleString?.() || item.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
