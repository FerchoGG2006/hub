import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './useCart';
import { CheckoutView } from './CheckoutView';

export const FloatingCart = ({ config, branch }) => {
  const { totalItems, totalPrice } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: totalItems > 0 ? 0 : 120, opacity: totalItems > 0 ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed bottom-2 right-3 z-[210]"
        style={{ pointerEvents: totalItems > 0 ? 'auto' : 'none' }}
      >
        <motion.button
          key={totalItems}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setCheckoutOpen(true)}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
          style={{
            background: 'rgba(253,248,239,0.08)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '0.5px solid rgba(245,158,11,0.25)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(245,158,11,0.1)',
          }}
        >
          <div className="relative">
            <span className="text-xl leading-none">🛍️</span>
            <motion.span key={totalItems} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-black"
              style={{ background: '#f59e0b', color: '#1a1008' }}>
              {totalItems}
            </motion.span>
          </div>
          <div className="text-left">
            <p className="text-[8px] uppercase font-bold tracking-widest leading-none mb-0.5" style={{ color: 'rgba(253,248,239,0.45)' }}>Pedido</p>
            <p className="font-bold leading-none text-sm" style={{ color: '#f59e0b' }}>
              ${(totalPrice / 1000).toFixed(0)}k
            </p>
          </div>
          <span className="text-xs opacity-60 ml-0.5" style={{ color: '#f59e0b' }}>›</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {checkoutOpen && <CheckoutView config={config} branch={branch} isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />}
      </AnimatePresence>
    </>
  );
};
