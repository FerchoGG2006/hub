import React from 'react';
import { motion } from 'framer-motion';

export const MenuCard = ({ product, onClick, index = 0, cartQuantity = 0 }) => {
  const { name, price, description, emoji, image } = product;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      onClick={() => onClick(product)}
      className="group relative bg-[#FFF8F0] border border-[#D4B896]/50 rounded-2xl px-3.5 py-3 flex items-center gap-3.5 cursor-pointer transition-all duration-200 active:scale-[0.97] hover:shadow-lg hover:shadow-[#8B5E3C]/12 hover:border-[#8B5E3C]/50"
      style={{ boxShadow: '0 3px 12px rgba(92,53,32,0.06)' }}
    >
      {/* Product Image / Icon container */}
      <div className="relative w-12 h-12 rounded-xl bg-[#F0DCC4] flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-200 shadow-inner border border-[#D4B896]/30">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl leading-none">{emoji || '🍪'}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[#3E1F0D] font-extrabold text-[13px] uppercase tracking-wider leading-tight">
            {name}
          </h3>
          {cartQuantity > 0 && (
            <span className="bg-[#10B981] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
              {cartQuantity} en carrito
            </span>
          )}
        </div>
        <p className="text-[#8B6F56] text-[11px] leading-snug mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Price badge */}
      <div className="shrink-0 relative">
        <span className="block bg-[#5C3520] group-hover:bg-[#4A2917] text-[#FFF8F0] font-black text-sm px-3.5 py-2 rounded-xl tracking-wide transition-colors" style={{
          boxShadow: '0 3px 10px rgba(92,53,32,0.22)'
        }}>
          {price}
        </span>
      </div>
    </motion.div>
  );
};
