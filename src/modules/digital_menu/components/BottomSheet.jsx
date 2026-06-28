import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomSheet = ({ isOpen, product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, product]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart({ ...product, quantity });
    onClose();
  };

  const numericPrice = product.numericPrice || 0;
  const totalPrice = numericPrice * quantity;
  const formattedTotal = `${totalPrice / 1000}K`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2A1508]/70 z-40 backdrop-blur-[6px]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden max-w-md mx-auto"
          >
            {/* Top decorative border */}
            <div className="h-1.5 bg-gradient-to-r from-[#C4956A] via-[#8B5E3C] to-[#C4956A]" />

            <div className="bg-gradient-to-b from-[#FFF8F0] to-[#F5E6D3] px-6 pt-4 pb-8 flex flex-col gap-5">
              {/* Grab handle */}
              <div className="w-10 h-1 bg-[#C4956A]/60 rounded-full mx-auto" />

              {/* Product info */}
              <div className="flex flex-col items-center gap-3 text-center pt-1">
                <div className="w-20 h-20 bg-[#F0DCC4] rounded-2xl flex items-center justify-center shadow-md overflow-hidden border-2 border-[#D4B896]/40">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{product.emoji || '🍪'}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#3E1F0D] uppercase tracking-wider">{product.name}</h2>
                  <span className="inline-block bg-[#5C3520]/10 text-[#5C3520] font-bold text-xs px-2.5 py-0.5 rounded-full mt-1">
                    ${product.numericPrice / 1000}K c/u
                  </span>
                </div>
                <p className="text-[#8B6F56] text-sm leading-relaxed max-w-[290px]">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-6 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full bg-[#5C3520] flex items-center justify-center text-2xl text-[#FFF8F0] active:scale-90 transition-transform shadow-md"
                >
                  −
                </button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-black text-[#3E1F0D] w-10 text-center tabular-nums"
                >
                  {quantity}
                </motion.span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full bg-[#5C3520] flex items-center justify-center text-2xl text-[#FFF8F0] active:scale-90 transition-transform shadow-md"
                >
                  +
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  onClick={handleAdd}
                  className="w-full bg-[#5C3520] hover:bg-[#4A2917] text-[#FFF8F0] font-black uppercase tracking-[0.15em] py-4 rounded-2xl active:scale-[0.97] transition-all text-[15px]"
                  style={{ boxShadow: '0 6px 20px rgba(92,53,32,0.3)' }}
                >
                  Añadir al carrito — ${formattedTotal}
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-[#8B6F56] hover:text-[#3E1F0D] font-bold uppercase tracking-widest py-2.5 rounded-2xl active:scale-[0.97] transition-all text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
