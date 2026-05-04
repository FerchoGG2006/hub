import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './useCart';
import { CheckoutView } from './CheckoutView';
import { useViewport916 } from './useViewport916';

export const FloatingCart = ({ config, branch }) => {
  const { totalItems } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { width: vpWidth } = useViewport916();
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isWideScreen = vpWidth > 0 && vpWidth < winWidth;
  const rightOffset = isWideScreen ? (winWidth - vpWidth) / 2 + 12 : 12;

  return (
    <>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: totalItems > 0 ? 0 : 120, opacity: totalItems > 0 ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed z-[210]"
        style={{ 
          bottom: 74,
          right: rightOffset,
          pointerEvents: totalItems > 0 ? 'auto' : 'none' 
        }}
      >
        <motion.button
          key={totalItems}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setCheckoutOpen(true)}
          className="relative flex items-center justify-center rounded-full w-[56px] h-[56px]"
          style={{
            background: 'rgba(253, 248, 239, 0.85)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            border: '0.5px solid rgba(197, 160, 89, 0.4)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.5)',
          }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 60%)' }} />

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Emoji as requested */}
            <span style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>📃</span>

            <motion.span key={totalItems} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -top-1 -right-1 z-10 w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-black"
              style={{ 
                background: '#1a1008', 
                color: '#f7e8b0', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
              {totalItems}
            </motion.span>
          </div>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {checkoutOpen && <CheckoutView config={config} branch={branch} isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />}
      </AnimatePresence>
    </>
  );
};
