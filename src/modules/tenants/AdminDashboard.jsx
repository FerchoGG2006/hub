/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
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
import { CajaManager } from './components/CajaManager';
import { InboxManager } from './components/InboxManager';

// Services & Hooks
import { authService } from '../auth/authService';
import { useProducts } from '../menus/useProducts';
import { WebSocketProvider, useWebSocketContext } from '../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TABS = [
  { id: 'pedidos', label: 'Órdenes', icon: '📝' },
  { id: 'caja', label: 'Caja', icon: '💰' },
  { id: 'carta', label: 'Mi Carta', icon: '🍽️' },
  { id: 'qr', label: 'Terminal QR', icon: '📱' },
  { id: 'analytics', label: 'Métricas', icon: '📊' },
  { id: 'marketing', label: 'Marketing', icon: '✨' },
  { id: 'inbox', label: 'Inbox', icon: '💬' },
  { id: 'events', label: 'Eventos', icon: '🎉' },
  // { id: 'settings', label: 'Identidad', icon: '🎨' },
  // { id: 'billing', label: 'SaaS Core', icon: '🛡️' },
];

export const AdminDashboard = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const storedToken = localStorage.getItem('hub_token');
  const storedTenant = localStorage.getItem('hub_tenant');
  const storedRole = localStorage.getItem('hub_role');
  // Solo consideramos autenticado si hay token Y (el tenant coincide O es superadmin)
  const [isAuth, setIsAuth] = useState(!!storedToken && (storedTenant === tenantSlug || storedRole === 'superadmin'));
  const [activeTab, setActiveTab] = useState('pedidos');
  const [config, setConfig] = useState(null);

  const [loginUser, setLoginUser] = useState(() => localStorage.getItem('platorin_auto_user') || '');
  const [loginPass, setLoginPass] = useState(() => localStorage.getItem('platorin_auto_pass') || '');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await authService.login(loginUser, loginPass);
      setIsAuth(true);
      localStorage.removeItem('platorin_auto_user');
      localStorage.removeItem('platorin_auto_pass');
    } catch {
      setLoginError('Credenciales inválidas');
    } finally {
      setLoginLoading(false);
    }
  };

  const [showTour, setShowTour] = useState(!localStorage.getItem('platorin_tour_seen'));
  const handleTourComplete = () => {
    localStorage.setItem('platorin_tour_seen', 'true');
    setShowTour(false);
  };

  const { products, toggleProduct, fetchProducts, magicSnap, updateImage } = useProducts(tenantSlug);

  useEffect(() => {
    if (isAuth) {
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
        .then(res => res.json())
        .then(json => setConfig(json.data || json))
        .catch(err => console.error("Error loading config:", err));
      
      fetchProducts();
    }
  }, [isAuth, tenantSlug, fetchProducts]);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="surface-editorial max-w-md w-full p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="logo text-4xl mb-1">Plato<b>rin</b></h1>
            <p className="tag-editorial">Panel de Administración</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">Usuario</label>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)}
                className="w-full bg-cream-deep/20 border border-border rounded-xl py-3.5 px-5 focus:border-gold outline-none transition-all" 
                placeholder="tu_usuario" autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">Contraseña</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                className="w-full bg-cream-deep/20 border border-border rounded-xl py-3.5 px-5 focus:border-gold outline-none transition-all" 
                placeholder="••••••" />
            </div>
            {loginError && <p className="text-red-500 text-xs text-center font-bold">{loginError}</p>}
            <button type="submit" disabled={loginLoading || !loginUser || !loginPass}
              className="btn-editorial w-full py-4 justify-center text-sm uppercase tracking-widest disabled:opacity-30">
              {loginLoading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

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
        updateImage={updateImage}
        navigate={navigate}
      />
    </WebSocketProvider>
  );
};

const AdminDashboardContent = ({ 
  config, tenantSlug, activeTab, setActiveTab, showTour, 
  handleTourComplete, products, toggleProduct, magicSnap, updateImage, navigate 
}) => {
  const { lastMessage, status, isConnected } = useWebSocketContext();
  const navRef = useRef(null);
  const tabRefs = useRef({});

  // Trial Calculation
  const validUntil = config?.valid_until ? new Date(config.valid_until) : null;
  const now = new Date();
  const daysLeft = validUntil ? Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24)) : null;

  // Auto-scroll to active tab
  useEffect(() => {
    const activeBtn = tabRefs.current[activeTab];
    if (activeBtn && navRef.current) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

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
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-white border-r border-[var(--border-soft)] flex-col items-center py-6 z-[100] shadow-sm overflow-y-auto no-scrollbar">
        <div className="flex-shrink-0 w-12 h-12 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center text-white font-black text-xl mb-8 shadow-lg shadow-[var(--brand-primary)]/20 cursor-pointer" onClick={() => navigate('/')}>
          P
        </div>
        
        <div className="flex flex-col gap-6 w-full items-center mb-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all group ${activeTab === tab.id ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary)]/20' : 'text-[var(--text-disabled)] hover:bg-[var(--bg-secondary)]'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[7px] uppercase font-black mt-1 tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => { authService.logout(); window.location.reload(); }}
          className="flex-shrink-0 w-12 h-12 mt-auto rounded-2xl bg-[var(--status-error)]/5 text-[var(--status-error)] flex items-center justify-center hover:bg-[var(--status-error)]/10 transition-colors"
        >
          🚪
        </button>
      </nav>

      {/* ── MOBILE BOTTOM DOCK ── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <nav 
          ref={navRef}
          className="bg-white/80 backdrop-blur-xl border border-[var(--border-soft)] h-20 rounded-[2.5rem] flex items-center px-4 shadow-heavy overflow-x-auto no-scrollbar scroll-smooth snap-x"
        >
            <div className="flex items-center gap-8 px-10">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  ref={el => tabRefs.current[tab.id] = el}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center min-w-[60px] snap-center transition-all ${activeTab === tab.id ? 'text-[var(--brand-primary)] scale-110' : 'text-[var(--text-disabled)] opacity-60'}`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-[6px] uppercase font-black mt-1 tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && <motion.div layoutId="mobile-indicator" className="w-1 h-1 bg-[var(--brand-primary)] rounded-full mt-1" />}
                </button>
              ))}
              
              {/* Logout inside mobile scroll */}
              <button 
                onClick={() => { authService.logout(); window.location.reload(); }}
                className="flex flex-col items-center min-w-[60px] snap-center text-[var(--status-error)] opacity-40"
              >
                <span className="text-xl">🚪</span>
                <span className="text-[6px] uppercase font-black mt-1 tracking-widest">Salir</span>
              </button>
            </div>
        </nav>
        {/* Visual mask indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-12 bg-gradient-to-l from-white/90 to-transparent pointer-events-none rounded-r-[2.5rem]" />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-12 bg-gradient-to-r from-white/90 to-transparent pointer-events-none rounded-l-[2.5rem]" />
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="md:pl-24 min-h-screen pb-32 md:pb-0">
        {/* ── TRIAL REMINDER BANNER ── */}
        {config?.subscription_status === 'active' && validUntil && daysLeft > 0 && (
            <div className="bg-amber-100 border-b border-amber-200 text-amber-800 text-xs font-bold text-center py-2.5 px-4">
                ✨ Estás en tu mes de prueba gratuita. Te quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'} de acceso total. 
                <button onClick={() => setActiveTab('billing')} className="underline ml-2 hover:text-amber-900 transition-colors">Ver planes</button>
            </div>
        )}
        {config?.subscription_status === 'suspended' && (
            <div className="bg-red-100 border-b border-red-200 text-red-800 text-xs font-bold text-center py-2.5 px-4">
                ⚠️ Tu periodo de prueba ha finalizado y tu cuenta está pausada. 
                <button onClick={() => setActiveTab('billing')} className="underline ml-2 hover:text-red-900 transition-colors">Renueva ahora</button>
            </div>
        )}

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
                        <span className={`text-[10px] font-bold whitespace-nowrap ${config?.whatsapp_number ? 'text-green-600' : 'text-[var(--text-disabled)]'}`}>
                          {config?.whatsapp_number ? 'Conectado' : 'No configurado'}
                        </span>
                    </div>
                </div>
            </header>

            {/* HEADER ESPACIADOR */}
            <div className="h-4" />
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

            {activeTab === 'caja' && (
              <motion.div key="caja" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CajaManager />
              </motion.div>
            )}

            {activeTab === 'carta' && (
              <motion.div key="carta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InventoryManager 
                  products={products} 
                  toggleProduct={toggleProduct} 
                  magicSnap={magicSnap} 
                  updateImage={updateImage}
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
                <QRTerminal tenantSlug={tenantSlug} config={config} />
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
                <BillingManager config={config} />
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EventsManager slug={tenantSlug} />
              </motion.div>
            )}

            {activeTab === 'inbox' && (
              <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InboxManager />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
