import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './CartContext';
import { CoverPage } from './CoverPage';
import { MenuEngine } from './MenuEngine';
import { FloatingCart } from './FloatingCart';

export default function App() {
  const [appState, setAppState] = useState('closed');

  return (
    <CartProvider>
      <main
        className="w-full bg-black select-none overflow-hidden"
        style={{ height: '100svh', touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <AnimatePresence mode="wait">
          {appState === 'closed' ? (
            <motion.div
              key="cover"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <CoverPage onOpen={() => setAppState('open')} />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <MenuEngine />
              <FloatingCart />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </CartProvider>
  );
}
