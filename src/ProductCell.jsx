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
      className="relative flex flex-row bg-white/[0.03] backdrop-blur-md rounded-[1.5rem] border border-white/10 overflow-hidden group transition-colors active:bg-white/[0.08]"
    >
      {/* Contenedor de Imagen Lateral */}
      <div className="relative w-[110px] flex-shrink-0 overflow-hidden bg-zinc-900 border-r border-white/5">
        {/* Usamos image_url o image como respaldo, si falla mostramos un fondo oscuro */}
        {item.image_url || item.image ? (
          <img 
            src={item.image_url || item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-white/[0.02]">
            {item.emoji || '🍽️'}
          </div>
        )}
      </div>

      {/* Información del Producto */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1 overflow-hidden">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="text-xs font-black text-white uppercase leading-tight tracking-wide break-words">
              {item.name}
            </h3>
            <span className="text-amber-400/90 font-mono text-[11px] font-black bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap mt-[-2px]">
              {item.price}
            </span>
          </div>
          
          <p className="text-[10px] text-slate-400 font-light leading-snug italic mt-1 line-clamp-4">
            {item.description || item.desc || "Exquisita preparación elaborada con ingredientes seleccionados."}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
