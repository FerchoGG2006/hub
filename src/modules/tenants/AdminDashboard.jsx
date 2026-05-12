/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Design System UI
import { Button, Modal } from '../../shared/ui';

// Modular Components
import { LiveMonitor } from '../analytics/components/LiveMonitor';
import { QRTerminal } from '../qr/components/QRTerminal';
import { InventoryManager } from '../menus/components/InventoryManager';
import { AddProductModal } from '../menus/components/AddProductModal';
import { BrandingSettings } from './components/BrandingSettings';
import { BillingManager } from '../payments/components/BillingManager';
import { KanbanBoard } from './components/KanbanBoard';
import { MarketingManager } from './components/MarketingManager';
import { InstagramAutopilot } from './components/InstagramAutopilot';
import { OnboardingTour } from './components/OnboardingTour';
import { EventsManager } from './components/EventsManager';
import { AdminPayments } from './components/AdminPayments';

// Services & Hooks
import { authService } from '../auth/authService';
import { useProducts } from '../menus/useProducts';
import { WebSocketProvider, useWebSocketContext } from '../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TABS = [
  { id: 'pedidos', label: 'Órdenes', icon: '📝' },
  { id: 'carta', label: 'Mi Carta', icon: '🍽️' },
  { id: 'qr', label: 'Terminal QR', icon: '📱' },
  { id: 'analytics', label: 'Métricas', icon: '📊' },
  { id: 'marketing', label: 'Marketing', icon: '✨' },
  { id: 'events', label: 'Eventos', icon: '🎉' },
  { id: 'settings', label: 'Identidad', icon: '🎨' },
  { id: 'billing', label: 'SaaS Core', icon: '🛡️' },
];

export const AdminDashboard = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('hub_token'));
  const [config, setConfig] = useState(null);

  const [showTour, setShowTour] = useState(!localStorage.getItem('platorin_tour_seen'));

  const handleTourComplete = () => {
    localStorage.setItem('platorin_tour_seen', 'true');
    setShowTour(false);
  };

  const { products, toggleProduct, fetchProducts, magicSnap } = useProducts(tenantSlug);

  useEffect(() => {
    if (isAuth) {
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
        .then(res => res.json())
        .then(json => setConfig(json.data || json))
        .catch(err => console.error("Error loading config:", err));
      
      fetchProducts();
    }
  }, [isAuth, tenantSlug, fetchProducts]);

  useEffect(() => { if (!isAuth) navigate('/'); }, [isAuth, navigate]);

  return (
    <WebSocketProvider tenantId={config?.id}>
      <AdminDashboardContent 
        config={config}
        tenantSlug={tenantSlug}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showTour={showTour}
        handleTourComplete={handleTourComplete}
        products={products}
        toggleProduct={toggleProduct}
        magicSnap={magicSnap}
        navigate={navigate}
      />
    </WebSocketProvider>
  );
};

const AdminDashboardContent = ({ 
  config, tenantSlug, activeTab, setActiveTab, showTour, 
  handleTourComplete, products, toggleProduct, magicSnap, navigate 
}) => {
  const { lastMessage, status, isConnected } = useWebSocketContext();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}

      {/* ── CONNECTION STATUS BANNER ── */}
      <AnimatePresence>
        {!isConnected && status !== 'connecting' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`fixed top-0 left-0 right-0 z-[150] text-center text-[10px] font-black uppercase tracking-[0.3em] py-2 ${status === 'reconnecting' ? 'bg-amber-500 text-black' : 'bg-red-600 text-white'}`}
          >
            {status === 'reconnecting' ? '⚡ Reconectando con el Servidor...' : '⚠️ Sin Conexión Operativa'}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── DESKTOP SIDEBAR ── */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-white border-r border-[var(--border-soft)] flex flex-col items-center py-10 z-[100] shadow-sm">
        <div className="w-12 h-12 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center text-white font-black text-xl mb-12 shadow-lg shadow-[var(--brand-primary)]/20 cursor-pointer" onClick={() => navigate('/')}>
          P
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all group ${activeTab === tab.id ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary)]/20' : 'text-[var(--text-disabled)] hover:bg-[var(--bg-secondary)]'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[7px] uppercase font-black mt-1 tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => { authService.logout(); window.location.reload(); }}
          className="w-12 h-12 rounded-2xl bg-[var(--status-error)]/5 text-[var(--status-error)] flex items-center justify-center hover:bg-[var(--status-error)]/10 transition-colors"
        >
          🚪
        </button>
      </nav>

      {/* ── MOBILE BOTTOM DOCK ── */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-[var(--border-soft)] h-20 rounded-[2.5rem] flex items-center justify-around px-4 z-[100] shadow-heavy">
          {TABS.slice(0, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center transition-all ${activeTab === tab.id ? 'text-[var(--brand-primary)]' : 'text-[var(--text-disabled)]'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[6px] uppercase font-black mt-1 tracking-widest">{tab.label}</span>
              {activeTab === tab.id && <motion.div layoutId="mobile-indicator" className="w-1 h-1 bg-[var(--brand-primary)] rounded-full mt-1" />}
            </button>
          ))}
      </nav>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="md:pl-24 min-h-screen pb-32 md:pb-0">
        {/* OPERATIONAL HEADER */}
        <div className="max-w-7xl mx-auto px-8 md:px-16 pt-12">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center font-black text-xs">
                        {config?.name?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-[0.2em] opacity-30">Platorin Command Center</h1>
                        <p className="text-xl font-[var(--font-serif)] italic font-bold">Bienvenido, <span className="text-[var(--brand-accent)]">{config?.name || 'Administrador'}</span></p>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex-shrink-0 px-5 py-3 bg-white border border-[var(--border-soft)] rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{isConnected ? 'Sistema Live' : 'Offline'}</span>
                    </div>
                    <div className="flex-shrink-0 px-5 py-3 bg-white border border-[var(--border-soft)] rounded-2xl flex items-center gap-4 shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">WhatsApp</span>
                        <span className="text-[10px] font-bold text-green-600 whitespace-nowrap">99.9% UP</span>
                    </div>
                </div>
            </header>

            {/* QUICK KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'Ventas Hoy', value: '$284k', trend: '+12%', color: 'var(--brand-primary)' },
                    { label: 'Pedidos', value: '24', trend: 'Live', color: 'var(--brand-accent)' },
                    { label: 'Ticket Prom.', value: '$12.5k', trend: 'estable', color: 'var(--text-primary)' },
                    { label: 'Prep. Media', value: '14 min', trend: '-2m', color: 'var(--status-success)' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white border border-[var(--border-soft)] p-6 rounded-[2rem] shadow-sm">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--text-disabled)] mb-2 font-black">{kpi.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black tracking-tighter" style={{ color: kpi.color }}>{kpi.value}</span>
                            <span className="text-[8px] font-bold opacity-40">{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 md:px-16 pb-16">
          <AnimatePresence mode="wait">
            {activeTab === 'pedidos' && (
              <motion.div key="pedidos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KanbanBoard 
                    tenantSlug={tenantSlug} 
                    tenantId={config?.id} 
                    lastMessage={lastMessage}
                />
              </motion.div>
            )}

            {activeTab === 'carta' && (
              <motion.div key="carta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InventoryManager 
                  products={products} 
                  toggleProduct={toggleProduct} 
                  magicSnap={magicSnap} 
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LiveMonitor tenantId={config?.id} />
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <QRTerminal tenantSlug={tenantSlug} />
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MarketingManager />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BrandingSettings />
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BillingManager tenantId={config?.id} />
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EventsManager tenantId={config?.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
