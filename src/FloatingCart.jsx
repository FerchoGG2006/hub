import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { CheckoutView } from './CheckoutView';

export const FloatingCart = () => {
  const { totalItems, totalPrice } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      {/* ── Floating button ── */}
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{
          y:       totalItems > 0 ? 0 : 120,
          opacity: totalItems > 0 ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed bottom-6 right-4 z-[200]"
        style={{ pointerEvents: totalItems > 0 ? 'auto' : 'none' }}
      >
        {/*
          key={totalItems}:
          Cada vez que se agrega un ítem React REMONTA el botón,
          disparando initial { scale: 1.2 } → animate { scale: 1 }.
          Esto es la confirmación visual de adición al carrito.
        */}
        <motion.button
          key={totalItems}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setCheckoutOpen(true)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background:           'rgba(255,255,255,0.08)',
            backdropFilter:       'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border:               '1px solid rgba(255,255,255,0.18)',
            boxShadow:            '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.15)',
          }}
        >
          {/* Icon + badge */}
          <div className="relative">
            <span className="text-2xl leading-none">🛍️</span>
            <motion.span
              key={totalItems}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black text-black"
              style={{ background: '#f59e0b' }}
            >
              {totalItems}
            </motion.span>
          </div>

          {/* Label + price */}
          <div className="text-left pr-1">
            <p className="text-[9px] text-white/45 uppercase font-bold tracking-widest leading-none mb-0.5">
              Tu Pedido
            </p>
            <p
              className="font-bold leading-none text-sm"
              style={{ color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}
            >
              ${(totalPrice / 1000).toFixed(0)}k
            </p>
          </div>

          <span className="text-amber-400 text-xs opacity-70 ml-1">›</span>
        </motion.button>
      </motion.div>

      {/* ── Checkout View ── */}
      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutView
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
