import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../shared/hooks/useCart';
import { CheckoutPanel } from './CheckoutPanel';
import { useViewportMode } from './core/hooks/useViewportMode';

export const FloatingCart = ({ config, branch }) => {
  const { totalItems } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { mode, dims } = useViewportMode();
  const vpWidth = dims.width;
  const [winWidth, setWinWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (mode === 'desktop') {
    return null; // El carrito ya está visible en el panel lateral permanentemente en Desktop
  }

  const isWideScreen = vpWidth > 0 && vpWidth < winWidth;
  const rightOffset = isWideScreen ? (winWidth - vpWidth) / 2 + 12 : 12;

  return (
    <>
      {/* 1. EL BOTÓN CIRCULAR ORIGINAL (CON ICONO DE HOJA Y BADGE) */}
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
            {/* Emoji de la cuenta */}
            <span style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>📃</span>

            <motion.span 
              key={totalItems} 
              initial={{ scale: 1.5 }} 
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -top-1 -right-1 z-10 w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-black"
              style={{ 
                background: '#1a1008', 
                color: '#f7e8b0', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {totalItems}
            </motion.span>
          </div>
        </motion.button>
      </motion.div>

      {/* 2. EL CAJÓN DE CHECKOUT DESLIZABLE PREMIUM (iOS BOTTOM SHEET CON FONDO CREMA/BLUR) */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            {/* Backdrop oscuro con desenfoque de fondo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[399] pointer-events-auto"
              onClick={() => setCheckoutOpen(false)}
            />
            {/* iOS Slide-up Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 top-16 z-[400] rounded-t-[2.5rem] overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
              style={{ 
                background: '#FDFAF5',
                width: vpWidth || '100%',
                left: isWideScreen ? (winWidth - vpWidth) / 2 : 0,
                right: isWideScreen ? (winWidth - vpWidth) / 2 : 0,
              }}
            >
              {/* Drag indicator */}
              <div className="w-12 h-1 bg-black/10 rounded-full mx-auto my-3 flex-shrink-0" />
              
              {/* Checkout Panel Content */}
              <div className="flex-1 overflow-hidden">
                <CheckoutPanel config={config} branch={branch} onClose={() => setCheckoutOpen(false)} isSidebar={false} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
