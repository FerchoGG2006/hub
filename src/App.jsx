import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './CartContext';
import { CoverPage } from './CoverPage';
import { MenuEngine } from './MenuEngine';
import { FloatingCart } from './FloatingCart';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdmin } from './SuperAdmin';
import { LandingPage } from './LandingPage';
import { BranchPicker } from './BranchPicker';
import { PrivacyPolicy } from './PrivacyPolicy';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/* ── MAIN APP ENGINE ── */
const MainApp = ({ config }) => {
  const [appState, setAppState] = useState('closed');
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (config.branches?.length === 1) return config.branches[0];
    
    // Check for ?sede=slug in URL
    const params = new URLSearchParams(window.location.search);
    const sedeSlug = params.get('sede');
    if (sedeSlug) {
      return config.branches.find(b => b.slug === sedeSlug) || null;
    }
    return null;
  });

  // If many branches and none selected, show picker
  if (config.branches?.length > 1 && !selectedBranch) {
    return (
      <BranchPicker 
        brandName={config.name} 
        branches={config.branches} 
        branding={config}
        onSelect={(b) => setSelectedBranch(b)} 
      />
    );
  }


  return (
    <CartProvider>
      <main className="w-full bg-[#050505] overflow-x-hidden min-h-svh">
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
              <FloatingCart config={config} branch={selectedBranch} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </CartProvider>
  );
};

/* ── TENANT RESOLVER ── */
/* ── TENANT RESOLVER ── */
const HubLoader = () => {
  const { tenantSlug } = useParams();
  // Normalize slug: remove trailing slashes and convert to lowercase
  const cleanSlug = tenantSlug?.replace(/\/$/, '').toLowerCase();
  
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Prevent fetching for obvious non-tenant assets
    if (!cleanSlug || ['favicon.ico', 'logo.png', 'manifest.json'].includes(cleanSlug)) return;

    fetch(`${API_URL}/api/v1/tenant/${cleanSlug}`)
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
        console.error("HubLoader Fetch Error:", err);
        setError(true);
      });
  }, [cleanSlug]);

  if (config?.subscription_status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="text-5xl">🚫</span>
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#f59e0b]">Servicio Suspendido</h1>
        <p className="text-xs text-white/50 tracking-wider">El acceso a la carta interactiva está inactivo temporalmente.<br/>El administrador del restaurante puede reactivar su suscripción en el panel Platorin.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
          <span className="text-2xl">🔍</span>
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">NEGOCIO NO ENCONTRADO</h2>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
          No pudimos localizar la carta de <span className="text-amber-500">{cleanSlug}</span>. <br/>
          Verifica que el link sea correcto o contacta al administrador.
        </p>
        <button onClick={() => window.location.href = '/'} className="mt-8 px-6 py-2 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all">
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
         <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
         <p className="mt-6 text-[8px] uppercase tracking-[0.5em] text-white/20 animate-pulse">Sincronizando Platorin...</p>
      </div>
    );
  }

  return <MainApp config={config} />;
};

import { RegisterBusiness } from './RegisterBusiness';

/* ── ROUTER ── */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterBusiness />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/admin/:tenantSlug" element={<AdminDashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/t/:tenantSlug" element={<HubLoader />} />
        <Route path="/:tenantSlug" element={<HubLoader />} />
      </Routes>
    </BrowserRouter>
  );
}
