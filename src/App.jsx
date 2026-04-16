import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './CartContext';
import { CoverPage } from './CoverPage';
import { MenuEngine } from './MenuEngine';
import { FloatingCart } from './FloatingCart';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdmin } from './SuperAdmin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── MAIN APP ENGINE ── */
const MainApp = ({ config }) => {
  const [appState, setAppState] = useState('closed');

  return (
    <CartProvider>
      <main className="w-full bg-[#050505] select-none overflow-hidden"
        style={{ height: '100svh', touchAction: 'none', overscrollBehavior: 'none' }}>
        <AnimatePresence mode="wait">
          {appState === 'closed' ? (
            <motion.div key="cover" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }} className="absolute inset-0">
              <CoverPage onOpen={() => setAppState('open')} config={config} />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }} className="absolute inset-0">
              <MenuEngine config={config} />
              <FloatingCart config={config} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </CartProvider>
  );
};

/* ── TENANT RESOLVER ── */
const HubLoader = () => {
  const { tenantSlug } = useParams();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(res => {
         if (!res.ok) throw new Error('Tenant not found');
         return res.json();
      })
      .then(data => {
        setConfig(data);
        if (data.brand_color) {
           document.documentElement.style.setProperty('--color-primary-500', data.brand_color);
        }
      })
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, [tenantSlug]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-white/40 tracking-widest text-[10px] uppercase">HUB NO ENCONTRADO</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
         <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <MainApp config={config} />;
};

/* ── ROUTER ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/:tenantSlug" element={<AdminDashboard />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:tenantSlug" element={<HubLoader />} />
        <Route path="/" element={<Navigate to="/la-rivera" replace />} /> {/* Default dev fallback */}
      </Routes>
    </BrowserRouter>
  );
}
