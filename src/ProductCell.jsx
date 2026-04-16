import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const ProductCell = ({ item, onAdd }) => {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd?.(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 650);

    // Track analytics event: 'add_to_cart'
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analytics/track?product_id=${item.id}&action=add_to_cart`, {
      method: 'POST'
    }).catch(err => console.warn('Analytics error:', err));
  };

  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      onClick={handleAdd}
      className="relative flex flex-col bg-white/[0.03] backdrop-blur-md rounded-[2rem] border border-white/10 overflow-hidden h-full group transition-colors active:bg-white/[0.08]"
    >
      {/* Contenedor de Imagen */}
      <div className="relative h-28 w-full overflow-hidden bg-zinc-900">
        {/* Usamos image_url o image como respaldo, si falla mostramos un fondo oscuro */}
        {item.image_url || item.image ? (
          <img 
            src={item.image_url || item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-white/[0.02]">
            {item.emoji || '🍽️'}
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
          <span className="text-amber-400 font-mono text-[10px] font-black">{item.price}</span>
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1">
        <div>
          <h3 className="text-[11px] font-black text-white uppercase leading-tight mb-1.5 tracking-wide">
            {item.name}
          </h3>
          
          {/* AQUÍ ESTÁ LA CORRECCIÓN: Usamos item.description o item.desc como respaldo, o un default if empty */}
          <p className="text-[9px] text-slate-400 font-light leading-snug italic line-clamp-3">
            {item.description || item.desc || "Exquisita preparación elaborada con los mejores y más frescos ingredientes seleccionados por el chef."}
          </p>
        </div>
        
        <div className="flex justify-end mt-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black text-[14px] font-black">+</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
