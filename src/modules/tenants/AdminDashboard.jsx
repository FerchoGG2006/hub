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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AdminDashboard = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('hub_token'));
  const [config, setConfig] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIIngest, setShowAIIngest] = useState(false);

  const { products, toggleProduct, fetchProducts, magicSnap } = useProducts(tenantSlug);

  useEffect(() => {
    if (isAuth) {
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
        .then(res => res.json())
        .then(setConfig)
        .catch(err => console.error("Error loading config:", err));
      
      fetchProducts();
    }
  }, [isAuth, tenantSlug, fetchProducts]);

  useEffect(() => { if (!isAuth) navigate('/'); }, [isAuth, navigate]);

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <OnboardingTour />
      
      {/* ── SIDEBAR NAVIGATION ── */}
      <nav className="fixed left-0 top-0 bottom-0 w-24 bg-white border-r border-[var(--border-soft)] flex flex-col items-center py-10 z-[100] shadow-sm">
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

      {/* ── MAIN CONTENT AREA ── */}
      <main className="pl-24 min-h-screen">
        <div className="max-w-7xl mx-auto p-8 md:p-16">
          <AnimatePresence mode="wait">
            {activeTab === 'pedidos' && (
              <motion.div key="pedidos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KanbanBoard tenantSlug={tenantSlug} tenantId={config?.id} />
              </motion.div>
            )}

            {activeTab === 'carta' && (
              <motion.div key="carta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InventoryManager 
                  products={products} 
                  toggleProduct={toggleProduct} 
                  magicSnap={magicSnap} 
                />
                <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[200]">
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    className="!shadow-2xl !py-6 !px-8 !text-xs !rounded-[2rem]"
                  >
                    + Agregar Plato
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <QRTerminal config={config} />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LiveMonitor tenantId={config?.id} />
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MarketingManager />
                <div className="mt-12">
                  <InstagramAutopilot />
                </div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EventsManager slug={tenantSlug} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BrandingSettings />
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BillingManager />
                <div className="mt-20">
                   <AdminPayments />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── MODALS ── */}
      <AddProductModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onProductAdded={fetchProducts} 
      />

      <AIIngestModal 
        isOpen={showAIIngest} 
        onClose={() => setShowAIIngest(false)} 
        onSuccess={fetchProducts} 
      />
    </div>
  );
};

const AIIngestModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleIngest = async () => {
    if (!file) {
      alert("Por favor selecciona la imagen de la carta física.");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/ai-ingest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      if (!res.ok) throw new Error("Error en la extracción AI");
      await res.json();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert("Fallo la migración: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Migración Inteligente (IA)">
      <div className="space-y-6">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Sube una foto de tu carta física actual. Nuestro sistema extraerá platos, precios y descripciones automáticamente.
        </p>
        <div className="border-2 border-dashed border-[var(--border-soft)] rounded-[var(--radius-lg)] p-8 text-center hover:border-[var(--brand-primary)] transition-colors cursor-pointer relative overflow-hidden group">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <p className="text-[10px] tracking-widest uppercase text-[var(--text-disabled)] group-hover:text-[var(--brand-primary)] transition-colors">
            {file ? file.name : "Subir Foto de la Carta"}
          </p>
        </div>
        <Button onClick={handleIngest} isLoading={loading} className="w-full py-4 text-[10px] uppercase tracking-widest">
          Iniciar Ingestión AI
        </Button>
      </div>
    </Modal>
  );
};
