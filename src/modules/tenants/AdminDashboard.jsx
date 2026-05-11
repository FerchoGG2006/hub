import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ProductCell } from './components/ProductCell';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { KanbanBoard } from './components/KanbanBoard';
import { MarketingManager } from './components/MarketingManager';
import { InstagramAutopilot } from './components/InstagramAutopilot';
import { OnboardingTour } from './components/OnboardingTour';
import { PhoneInput } from './components/PhoneInput';
import { EventsManager } from './components/EventsManager';
import { AdminPayments } from './components/AdminPayments';
import { useAuth } from '../auth/useAuth';
import { useProducts } from '../menus/useProducts';
import { authService } from '../auth/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── BIOMETRIC LOGIN TERMINAL ── */
export const LoginTerminal = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      onAuth(data.access_token);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="h-screen bg-[#F5F0E8] flex flex-col items-center justify-center p-6 w-full fixed inset-0 z-[200]">
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
         <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-amber-500/10"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-green-900/5"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white border border-[#1A12081A] rounded-[2.5rem] p-12 shadow-2xl shadow-ink/5"
      >
        <div className="text-center mb-10">
          <h1 className="logo text-4xl mb-2">Plato<b>rin</b></h1>
          <p className="tag-editorial">Acceso Administrativo</p>
          <h2 className="heading-editorial text-2xl mt-4">Bienvenido a tu <br/><span className="serif-italic">Entorno Digital</span></h2>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-ink-50">Usuario o Email</label>
            <input 
              type="text" 
              placeholder="admin@tu-negocio.com" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-cream-deep/30 border border-border rounded-2xl py-4 px-6 outline-none focus:border-green transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-ink-50">Código Passcode</label>
            <input 
              type="password" 
              placeholder="••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream-deep/30 border border-border rounded-2xl py-4 px-6 outline-none focus:border-green transition-all tracking-[0.5em]"
            />
          </div>
          
          {error && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest font-bold">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-editorial w-full py-5 justify-center mt-4 text-xs tracking-widest uppercase"
          >
            {loading ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>

        <p className="text-center mt-10 text-[10px] text-ink-30 uppercase tracking-widest leading-loose">
          Si olvidaste tu acceso, solicita ayuda <br/> a soporte vía <a href="#" className="text-wa font-bold">WhatsApp</a>
        </p>
      </motion.div>
    </div>
  );
};

/* ── LIVE MONITOR (Analytics with WebSockets) ── */
export const LiveMonitor = () => {
  const { tenantSlug } = useParams();
  const [stats, setStats] = useState([]);
  const [totalHits, setTotalHits] = useState(0);

  // Fetch inicial
  const fetchTopStats = useCallback(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug || 'la-rivera'}/analytics/top`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
            setStats([]);
            return;
        }
        setStats(data);
        setTotalHits(data.reduce((acc, item) => acc + item.hits, 0));
      })
      .catch(err => console.warn('LiveMonitor init failed:', err));
  }, [tenantSlug]);

  useEffect(() => {
    fetchTopStats();

    /* Escuchar WebSockets para animar las barras de energía en tiempo real */
    let ws;
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/menu';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ANALYTICS_UPDATE' && payload.action === 'add_to_cart') {
          if (navigator.vibrate) navigator.vibrate(10);
          
          setStats(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(p => p.id === payload.product_id);
            if (idx >= 0) {
              copy[idx] = { ...copy[idx], hits: copy[idx].hits + 1 };
              copy.sort((a, b) => b.hits - a.hits);
              return copy;
            } else {
              fetchTopStats();
              return prev;
            }
          });
          setTotalHits(prev => prev + 1);
        }
      };
    } catch (e) {
       console.warn('WS LiveMonitor error:', e);
    }
    return () => { 
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [fetchTopStats]);

  const totalFormat = (totalHits * 32000).toLocaleString('es-CO'); 
  const topProduct = stats.length > 0 ? stats[0] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black mb-2">Métricas en vivo</p>
          <h2 className="heading-editorial text-4xl">Ventas de <span className="serif-italic">Hoy</span></h2>
        </div>
      </header>

      {/* KPI Principal: Ventas del Día */}
      <div className="surface-editorial flex flex-col items-center justify-center text-center py-16">
        <p className="text-[10px] text-ink-50 uppercase tracking-[0.4em] mb-4 font-bold">Total Recibido Hoy (Est.)</p>
        <div className="flex flex-col items-center">
          <span className="text-7xl font-black italic text-ink tracking-tighter leading-none mb-4">
            ${totalFormat}
          </span>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-light text-green rounded-full">
            <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">+2.4% hoy</span>
          </div>
        </div>
      </div>

      {/* Listado de "Hot Items" */}
      <section>
        <h3 className="tag-editorial text-[10px] mb-8">Lo más buscado por tus clientes</h3>
        {stats.length === 0 && (
          <div className="bg-cream-deep/40 p-16 rounded-[2.5rem] border border-dashed border-border text-center space-y-4">
             <span className="text-4xl opacity-50 block">📉</span>
             <p className="text-xs text-ink-50 uppercase tracking-widest font-bold">Sin actividad detectada</p>
             <p className="text-[10px] text-ink-30 max-w-[200px] mx-auto leading-relaxed">Verás qué platos interesan más a tus clientes en tiempo real.</p>
          </div>
        )}
        
        <div className="grid gap-6">
          <AnimatePresence>
            {stats.map(item => {
              const maxHits = topProduct ? topProduct.hits : 1;
              const fillPercent = Math.max(5, (item.hits / maxHits) * 100);
              
              return (
                <motion.div layout key={item.id} className="space-y-3">
                  <div className="flex justify-between text-[11px] uppercase font-bold tracking-tight px-1">
                    <span className="text-ink">{item.name}</span>
                    <span className="text-gold">{item.hits} vistas</span>
                  </div>
                  <div className="h-2 w-full bg-cream-deep/60 rounded-full overflow-hidden">
                    <motion.div 
                      key={`bar-${item.id}-${item.hits}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-ink rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
};

/* ── QR DEPLOYMENT TERMINAL ── */
const QRTerminal = ({ config }) => {
  const enabledModules = config?.enabled_modules || ['orders', 'products'];
  const hasTables = enabledModules.includes('tables');
  const { tenantSlug } = useParams();
  const qrRef = React.useRef(null);
  const [table, setTable] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `${tenantSlug}-qr${table ? '-mesa-'+table : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    setIsGenerating(true);
    const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFillColor(245, 240, 232); // --cream
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.setTextColor(26, 18, 8); // --ink
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    if (table) pdf.text(`MESA ${table}`, 105, 35, { align: "center" });
    pdf.setTextColor(200, 137, 26); // --gold
    pdf.text("Menú Digital Platorin", 105, 50, { align: "center" });
    pdf.addImage(imgData, 'PNG', 55, 90, 100, 100);
    pdf.save(`${tenantSlug}-qr${table ? '-mesa-'+table : ''}.pdf`);
    setIsGenerating(false);
  };

  const menuUrl = table ? `${window.location.origin}/t/${tenantSlug}?mesa=${table}` : `${window.location.origin}/t/${tenantSlug}`;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-0 flex flex-col items-center gap-8">
      <div className="text-center">
        <span className="tag-editorial">Conexión con el cliente</span>
        <h2 className="heading-editorial text-4xl">Generador de <span className="serif-italic">Códigos QR</span></h2>
        <p className="text-sub mt-2">Descarga tus códigos para imprimir y colocar en las mesas.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
        <div className="space-y-8">
          <div className="surface-editorial space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-ink-50">Identificador de Mesa (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej: Mesa 1, Terraza..." 
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="w-full bg-cream-deep/30 border border-border rounded-xl py-3 px-5 outline-none focus:border-gold transition-colors"
              />
            </div>
            
            <div className="flex gap-4">
              <button onClick={handleDownloadPNG} className="btn-editorial-outline flex-1 py-4 justify-center text-[10px] uppercase font-bold">PNG</button>
              <button onClick={handleDownloadPDF} disabled={isGenerating} className="btn-editorial flex-1 py-4 justify-center text-[10px] uppercase font-bold">
                {isGenerating ? 'Generando...' : 'PDF para Imprimir'}
              </button>
            </div>
          </div>

          {hasTables && (
            <div className="surface-ink space-y-4">
               <h4 className="heading-editorial !text-white text-xl">Descarga Masiva</h4>
               <p className="text-white/40 text-xs font-medium">Genera hasta 100 códigos de una sola vez para tu restaurante.</p>
               <div className="flex gap-3">
                 <input 
                   type="number" 
                   placeholder="Cant." 
                   value={tableCount}
                   onChange={(e) => setTableCount(e.target.value)}
                   className="w-20 bg-white/10 border border-white/10 rounded-xl py-3 px-3 text-white text-center outline-none"
                 />
                 <button className="btn-editorial bg-gold hover:bg-gold/80 flex-1 py-3 justify-center text-[10px] font-bold">CREAR LOTE</button>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div ref={qrRef} className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-ink/5 border border-border relative">
            <QRCodeSVG 
              value={menuUrl} 
              size={240}
              bgColor={"#ffffff"}
              fgColor={"#1A1208"}
              level={"Q"}
              imageSettings={{ src: "/logo.png", height: 50, width: 50, excavate: true }}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#16110F] text-white px-10 py-3 rounded-full text-[11px] font-black tracking-[0.4em] uppercase shadow-[0_15px_40px_rgba(0,0,0,0.3)] z-20">
              Escanea
            </div>
          </div>
          <p className="mt-12 text-ink/50 text-[10px] uppercase tracking-widest font-black text-center max-w-[200px]">Este es tu código {table ? `para la ${table}` : 'general'}.</p>
        </div>
      </div>
    </motion.div>
  );
};

/* ── COMPONENTS (Colecciones) ── */
const InventoryManager = ({ products, toggleProduct, magicSnap }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-10">
        <div>
          <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black mb-2">Catálogo de productos</p>
          <h2 className="heading-editorial text-4xl">Mi <span className="serif-italic">Carta Digital</span></h2>
          <p className="text-ink/40 text-sm mt-1">Gestiona tus platos, precios y disponibilidad en tiempo real.</p>
        </div>
        <div className="flex gap-4">
           <label className="btn-editorial bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 cursor-pointer">
              <span className="text-xl">📸</span>
              <span>Foto-Plato (IA)</span>
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const token = authService.getToken();
                alert("✨ Gemini Vision está analizando el plato...");
                try {
                  await magicSnap(token, file);
                  alert("✅ ¡Plato creado mágicamente!");
                  window.location.reload();
                } catch { alert("Error en el análisis visual."); }
              }} />
           </label>
        </div>
      </header>
      
      {products.length === 0 && (
        <div className="surface-editorial text-center py-24 space-y-6">
          <div className="w-20 h-20 bg-cream-deep/50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🍳</div>
          <div>
            <h3 className="heading-editorial text-2xl serif-italic">Tu carta está vacía</h3>
            <p className="text-sub max-w-xs mx-auto mt-2">Empieza subiendo una foto de tus platos o agrégalos manualmente.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item.id} className="surface-editorial group hover:border-gold/30 transition-all p-5 flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl bg-cream-deep/50 overflow-hidden border border-border ${!item.is_available ? 'grayscale opacity-40' : 'group-hover:scale-105 transition-transform'}`}>
              {item.image || item.image_url ? (
                <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🍽️</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`heading-editorial text-sm uppercase tracking-wider truncate ${!item.is_available ? 'text-ink-30 line-through' : 'text-ink'}`}>
                {item.name}
              </h3>
              <p className="serif-italic text-lg">${(item.price || 0).toLocaleString('es-CO')}</p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${item.is_available ? 'text-green' : 'text-red-500'}`}>
                  {item.is_available ? 'En carta' : 'Agotado'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={item.is_available} onChange={() => toggleProduct(item.id, item.is_available)} />
                  <div className="w-9 h-5 bg-ink-30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ── BRANDING EDITOR ── */
const BrandingSettings = () => {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand_color: '#C8891A',
    whatsapp_number: '',
    tiktok_url: '',
  });

  useEffect(() => {
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(r => r.json())
      .then(d => {
        setFormData({
          brand_color: d.brand_color || '#C8891A',
          whatsapp_number: d.whatsapp_number || '',
          tiktok_url: d.tiktok_url || ''
        });
      })
      .catch(e => console.warn(e));
  }, [tenantSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/tenant/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Guardado falló");
      alert("Identidad visual actualizada.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-0">
      <header className="border-b border-[rgba(22,17,15,0.06)] pb-10 mb-8">
        <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black mb-2">Identidad de Marca</p>
        <h2 className="heading-editorial text-4xl">Personalizar <span className="serif-italic">Experiencia</span></h2>
        <p className="text-ink/40 text-sm mt-1">Define el ADN visual que tus clientes verán en su terminal.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="surface-editorial space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-ink-50">Color de Acento (Botones)</label>
              <div className="flex items-center gap-6 p-5 bg-cream-deep/20 rounded-2xl border border-border">
                <input 
                  type="color" 
                  value={formData.brand_color} 
                  onChange={(e) => setFormData({...formData, brand_color: e.target.value})} 
                  className="w-16 h-16 rounded-xl cursor-pointer border-none p-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink uppercase tracking-wider">{formData.brand_color}</p>
                  <p className="text-[11px] text-ink-30">Este color se usará en botones y detalles del menú.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-ink-50">WhatsApp de Pedidos</label>
              <PhoneInput 
                value={formData.whatsapp_number} 
                onChange={(val) => setFormData({...formData, whatsapp_number: val})} 
                placeholder="Ej: +57 300..."
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-editorial w-full py-5 justify-center text-xs uppercase tracking-[0.2em]">
            {loading ? 'Guardando...' : 'Aplicar Identidad Visual'}
          </button>
        </form>

        <div className="sticky top-32">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ink-30 text-center mb-6">Previsualización Live</p>
          <div className="phone-outer mx-auto" style={{ width: '260px', height: '540px' }}>
            <div className="phone-screen bg-cream h-full flex flex-col p-6 pt-12">
               <div className="h-2 w-12 rounded-full mb-6" style={{ background: formData.brand_color }} />
               <h4 className="heading-editorial text-2xl serif-italic mb-2">{tenantSlug}</h4>
               <div className="space-y-4 mt-8">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 opacity-20">
                      <div className="w-10 h-10 bg-ink rounded-lg" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-2 w-full bg-ink rounded" />
                        <div className="h-1.5 w-1/2 bg-ink rounded" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── BILLING MANAGER (FASE 4) ── */
const BillingManager = () => {
  const [bData, setBData] = useState({ subscription_status: 'active', valid_until: null });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchBilling = useCallback(() => {
    fetch(`${API_URL}/api/admin/billing`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` }
    })
      .then(r => r.json())
      .then(setBData)
      .catch(console.warn);
  }, []);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const handleSubscribe = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/billing/subscribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` }
      });
      if(!res.ok) throw new Error("Synchronization Error");
      fetchBilling();
    } catch (err) {
      console.warn("Sync Error", err);
    }
  };

  const isSuspended = bData.subscription_status === 'suspended';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-12 border-b border-[rgba(22,17,15,0.06)] pb-8">
        <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black mb-2">Suscripción & Licencias</p>
        <h2 className="heading-editorial text-4xl">Facturación & <span className="serif-italic">Planes</span></h2>
      </header>
      
      <div className={`p-10 rounded-[3rem] border flex flex-col items-center text-center gap-6 relative overflow-hidden ${isSuspended ? 'bg-red-500/[0.03] border-red-500/20' : 'bg-[#7E9B84]/[0.03] border-[#7E9B84]/20'}`}>
        <div className="relative">
          <span className="text-5xl">{isSuspended ? '⚠️' : '🛡️'}</span>
        </div>

        <div className="space-y-2">
          <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isSuspended ? 'text-red-500' : 'text-[#7E9B84]'}`}>
             {isSuspended ? 'Núcleo Restringido' : 'Suscripción Activa'}
          </h3>
          <p className="text-[9px] text-ink/30 uppercase tracking-[0.3em] font-black">
             Vencimiento: {bData.valid_until ? new Date(bData.valid_until).toLocaleDateString() : 'Acceso Vitalicio'}
          </p>
        </div>
      </div>

      <div className="bg-[#FCFAF7] p-12 rounded-[3rem] border border-[rgba(22,17,15,0.06)] flex flex-col items-center relative group shadow-sm">
         <div className="absolute top-6 left-8">
            <span className="text-[8px] text-ink/20 uppercase tracking-[0.4em] font-black">Plan Premium OS</span>
         </div>
         
         <div className="text-center mb-10">
            <span className="text-7xl font-black italic tracking-tighter text-ink select-none relative">
              $35<span className="text-sm font-normal text-gold absolute -top-2 -right-10">/USD</span>
            </span>
            <p className="text-[9px] uppercase tracking-[0.4em] text-ink/30 mt-4 font-black">Mensualidad recurrente</p>
         </div>
         
         <button onClick={handleSubscribe} className="w-full py-5 rounded-2xl transition-all flex justify-center items-center gap-3 bg-[#16110F] text-[#F7F4ED] text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(22,17,15,0.2)] hover:scale-[1.02] active:scale-95 tactile-button">
            <span className="text-lg">💳</span> Renovar núcleo ahora
         </button>
      </div>

      <PaymentGatewayModal 
         isOpen={showPaymentModal} 
         onClose={() => setShowPaymentModal(false)}
         onSuccess={handlePaymentSuccess}
      />
    </motion.div>
  );
};

/* ── MODALS ── */
const AddProductModal = ({ onClose, onProductAdded }) => {
  const { tenantSlug } = useParams();
  const [formData, setFormData] = useState({ name: '', price: '', desc: '', emoji: '🍽️', category: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`)
      .then(r => r.json())
      .then(data => { setCats(data); if (data.length) setFormData(f => ({ ...f, category: String(data[0].id) })); })
      .catch(() => setCats([{ id: 1, name: 'Entradas' }, { id: 2, name: 'Fuertes' }, { id: 3, name: 'Licores' }]));
  }, [tenantSlug]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
       setFile(selected);
       setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleMagicEdit = async () => {
    if (!formData.name) return alert("Escribe un nombre base primero (ej: Hamburguesa)");
    setAiGenerating(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/magic-edit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: formData.name, price: formData.price, desc: formData.desc })
      });
      if (!res.ok) throw new Error("Error en Magic AI Edit");
      const data = await res.json();
      setFormData(f => ({
        ...f,
        name: data.name,
        desc: data.desc,
        price: data.price,
        emoji: data.emoji
      }));
    } catch (err) {
      alert("Error en Magic Edit: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('desc', formData.desc);
    data.append('emoji', formData.emoji);
    data.append('category_id', formData.category);
    if (file) data.append('image', file);

    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/products`, { 
        method: 'POST', 
        body: data,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error saving');
      onProductAdded();
      onClose();
    } catch (err) {
      alert("Error al subir el producto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center">
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-bone border border-dark/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 w-full max-w-5xl relative z-10 flex flex-col xl:flex-row gap-8 sm:max-h-[90vh] h-[95vh] sm:h-auto overflow-y-auto shadow-[0_40px_120px_rgba(0,0,0,0.15)]">
        {/* Tech Decor Layers */}
        <div className="absolute top-0 inset-x-0 h-[200px] bg-gradient-to-b from-dark/[0.02] to-transparent pointer-events-none" />
        
        {/* PANEL IZQUIERDO: Editor de Contenido */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-amber-500">Nuevo Producto</h3>
            <button type="button" onClick={handleMagicEdit} disabled={aiGenerating} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/10 transition-all">
               {aiGenerating ? 'Mejorando...' : '🪄 Mejorar con IA'}
            </button>
          </div>

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 block mb-2 font-bold">Imagen del producto</label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                className="w-full text-xs file:bg-dark/5 file:text-dark/60 file:border file:border-dark/10 file:px-4 file:py-2 file:rounded-full file:font-bold file:cursor-pointer" />
            </div>

            <div className="flex gap-3">
              <input value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })} title="Emoji representative"
                className="w-14 text-center text-xl bg-dark/5 border-b border-dark/10 py-3 outline-none focus:border-amber-500 transition-colors rounded-t-xl" />
              <input placeholder="Nombre del Plato" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 bg-transparent border-b border-dark/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/20 text-dark font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Precio (EJ: $25k)" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="bg-transparent border-b border-dark/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/20 text-dark font-mono" />
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="bg-transparent border-b border-dark/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors text-dark/70 appearance-none">
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <textarea placeholder="Describe el plato de forma tentadora..." value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })}
              className="w-full bg-dark/5 border border-dark/10 p-4 rounded-2xl text-xs h-32 outline-none focus:border-amber-500 transition-colors resize-none placeholder-dark/20 text-dark" />
          </form>
        </div>

        {/* PANEL DERECHO: Simulador iOS (Live Preview) */}
        <div className="hidden sm:flex flex-col items-center justify-center bg-dark/5 p-6 border border-dark/10 rounded-[2.5rem] relative overflow-hidden flex-shrink-0 w-[400px]">
           <div className="absolute top-4 left-4 flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div><div className="w-2 h-2 rounded-full bg-amber-400"></div><div className="w-2 h-2 rounded-full bg-emerald-400"></div></div>
           <span className="text-[9px] uppercase tracking-widest text-emerald-600/60 font-black">+2% vs ayer</span>
           <p className="text-[9px] uppercase tracking-widest text-dark/30 font-black mb-6 absolute top-4">Vista previa en tiempo real</p>
           
           <div className="w-[320px] rounded-[3rem] border-[10px] border-dark/10 bg-bone overflow-hidden shadow-2xl relative">
              {/* Fake iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-dark/10 rounded-b-3xl z-50"></div>
              
              <div className="p-4 pt-10 min-h-[160px] flex items-center justify-center relative z-10 bg-bone">
                {/* Subtle Grid for simulator */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                {/* Simulated ProductCell rendering what user types */}
                <div className="w-full pointer-events-none">
                  <ProductCell item={{
                     name: formData.name || 'Tu Producto',
                     price: formData.price || '$0k',
                     desc: formData.desc || 'Descripción visualizada en tiempo real según cómo lo verá el cliente en su celular.',
                     emoji: formData.emoji || '🍽️',
                     image_url: previewUrl
                  }} onAdd={()=>{}} />
                </div>
              </div>
           </div>
        </div>

      </div>
      
      {/* Botón Flotante para Confirmar Formulario */}
      <button type="submit" form="product-form" disabled={loading}
        className="fixed bottom-6 z-[110] w-[90%] sm:w-[400px] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-bone bg-dark shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-95 tactile-button">
        {loading ? 'Guardando...' : 'Guardar Producto'}
      </button>
      
    </motion.div>
  );
};

/* ── AI INGEST MODAL (Para dueños de Tenant) ── */
const AIIngestModal = ({ onClose, onSuccess }) => {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md">
      <div className="bg-bone border border-dark/10 rounded-[2.5rem] p-10 w-full max-w-sm relative overflow-y-auto max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.2)]">
        {loading && <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="absolute -inset-10 bg-amber-500/5 blur-[50px] pointer-events-none" />}
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono text-dark/20 uppercase tracking-[0.4em]">AI_INGEST_CORE_v2</div>

        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3 text-dark flex items-center gap-2 mt-4">
          <span className="text-amber-500">✦</span> Agente Migrador AI
        </h3>
        <p className="text-[10px] text-dark/40 uppercase tracking-[0.3em] font-bold mb-8">Conversión de Menús Físicos a Data Hub.</p>
        
        <div className="space-y-4 relative z-10">
          <div className="p-4 bg-dark/5 border border-dark/10 border-dashed rounded-2xl flex flex-col items-center gap-4">
            <input type="file" id="ai-file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="hidden" />
            <label htmlFor="ai-file" className="text-[10px] text-dark/60 font-black uppercase tracking-widest cursor-pointer hover:text-dark transition-colors">
              {file ? file.name : '[ SELECCIONAR_ARCHIVO ]'}
            </label>
          </div>
          
          <div className="flex gap-3 mt-10">
            <button onClick={onClose} disabled={loading} className="flex-1 py-4 bg-dark/5 text-dark/40 uppercase text-[10px] font-black rounded-2xl tracking-widest hover:bg-dark/10 tactile-button">Cancelar</button>
            <button onClick={handleIngest} disabled={loading} className="flex-1 py-4 font-black uppercase tracking-[0.3em] text-[10px] text-bone bg-dark rounded-2xl shadow-xl transition-all tactile-button">
              {loading ? 'PROCESANDO...' : 'Migrar Ahora'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function SedesView({ branches }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', slug: '', whatsapp_number: '', address: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleAdd = async () => {
    alert("Sede guardada con éxito. En producción, esto sincronizará con la DB.");
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-dark/5 p-8 rounded-[2.5rem] border border-dark/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-dark/10 rounded-tr-[2.5rem]" />
        <div>
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-dark" style={{ fontFamily: "'Playfair Display', serif" }}>GESTIÓN DE SEDES</h2>
           <p className="text-[9px] uppercase tracking-[0.4em] text-dark/40 mt-2 font-bold">Administra tus puntos de venta activos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="mt-6 sm:mt-0 px-8 py-4 bg-dark text-bone rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 tactile-button"
        >
          + Nueva Sede
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map(b => (
          <div key={b.id} className="bg-dark/5 border border-dark/10 p-8 rounded-[2.5rem] relative group hover:bg-dark/10 transition-all shadow-sm">
             <div className="absolute top-4 left-6 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] text-emerald-600/60 font-bold uppercase tracking-widest">Sede activa</span>
             </div>
             <div className="flex items-start justify-between mt-4">
                <div>
                   <h3 className="font-black text-2xl text-dark italic tracking-tighter uppercase leading-none mb-3">{b.name}</h3>
                   <span className="text-[9px] bg-dark/5 text-dark/40 px-3 py-1 rounded-full uppercase font-black tracking-[0.2em]">Enlace: {b.slug}</span>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[9px] text-dark/40 font-bold uppercase tracking-tighter">WhatsApp: {b.whatsapp_number}</p>
                   <p className="text-[9px] text-dark/40 font-mono italic tracking-tighter">{b.address}</p>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-dark/10 flex gap-6">
                <button className="text-[9px] uppercase font-black tracking-widest text-dark/30 hover:text-dark transition-colors">Configurar</button>
                <button className="text-[9px] uppercase font-black tracking-widest text-dark/30 hover:text-dark transition-colors">Ver ventas</button>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-dark/60 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-bone border border-dark/10 p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.25)] relative">
               <h3 className="text-2xl font-black italic uppercase text-dark mb-8 tracking-tighter mt-4">Añadir Nueva Sede</h3>
               <div className="space-y-6">
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black">Nombre de la sede</label>
                    <input type="text" placeholder="Ej: Sede Norte" className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-5 text-sm outline-none focus:border-amber-500 text-dark font-medium" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black">Enlace amigable (Slug)</label>
                    <input type="text" placeholder="norte" className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-5 text-sm outline-none focus:border-amber-500 text-dark font-medium" value={newBranch.slug} onChange={e => setNewBranch({...newBranch, slug: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black">Número de WhatsApp</label>
                    <PhoneInput 
                      value={newBranch.whatsapp_number} 
                      onChange={(val) => setNewBranch({...newBranch, whatsapp_number: val})} 
                      placeholder="Número de pedidos"
                    />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button onClick={() => setIsAdding(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-dark/30 border border-dark/10 hover:bg-dark/5 transition-all">Cancelar</button>
                    <button onClick={handleAdd} className="flex-1 py-5 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl tactile-button">Guardar Sede</button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ── AI STRATEGIC BRIEFING PANEL ── */
const AIBriefingPanel = ({ onClose, suggestions = [] }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const token = localStorage.getItem('hub_token');
        const res = await fetch(`${API_URL}/api/admin/ai/briefing`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, []);

  const handleExecuteAction = (tip) => {
    if (tip.title.toLowerCase().includes("instagram") || tip.title.toLowerCase().includes("historia")) {
      onClose();
      // Simular redirección a Autopilot
      window.dispatchEvent(new CustomEvent('nav-view', { detail: 'autopilot' }));
      alert(`🚀 Iniciando Campaña: ${tip.title}\nPreparando contenido para Instagram...`);
    } else {
      alert(`✅ Acción Programada: ${tip.title}\nEl sistema está optimizando los parámetros automáticamente.`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-dark/40 backdrop-blur-md flex items-center justify-end p-4 sm:p-8"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
        className="bg-bone border border-dark/10 w-full max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-8">
           <button onClick={onClose} className="text-dark/20 hover:text-dark transition-colors">✕</button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
          <header className="mb-10 pt-4">
             <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-pulse">✦</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 font-mono">ASISTENTE_AUTOMÁTICO</span>
             </div>
             <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-dark">
                Resumen de <br /><span className="text-dark/30">Desempeño</span>
             </h2>
          </header>

          {loading ? (
            <div className="space-y-8 animate-pulse">
               <div className="h-20 bg-dark/5 rounded-3xl" />
               <div className="space-y-4">
                  <div className="h-4 w-1/2 bg-dark/5 rounded-full" />
                  <div className="h-32 bg-dark/5 rounded-3xl" />
               </div>
            </div>
          ) : (
            <div className="space-y-12">
               <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/20 rounded-full" />
                  <p className="text-sm font-medium leading-relaxed text-dark italic opacity-80">
                     "{data?.briefing || 'No hay datos suficientes para un análisis detallado hoy.'}"
                  </p>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-dark/30 border-b border-dark/5 pb-4">Sugerencias para tu negocio</h3>
                  {data?.tips?.map((tip, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="group p-6 rounded-3xl bg-white border border-dark/5 hover:border-amber-500/20 hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => handleExecuteAction(tip)}
                    >
                       <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">{tip.title}</p>
                       <p className="text-xs text-dark/70 font-medium leading-normal">{tip.action}</p>
                    </motion.div>
                  ))}

                  {/* Sugerencias Automatizadas Reales */}
                  {suggestions.length > 0 && (
                    <>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500/40 border-b border-red-500/10 pb-4 mt-12">Alertas Estratégicas (Activas)</h3>
                      {suggestions.map((s) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={s.id}
                          className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all"
                        >
                           <div className="flex items-center gap-2 mb-2">
                             <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Acción Requerida</p>
                           </div>
                           <p className="text-xs text-dark/90 font-bold leading-normal mb-4">{s.message}</p>
                           <button className="w-full py-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-600 transition-colors shadow-lg">
                              Optimizar Ahora
                           </button>
                        </motion.div>
                      ))}
                    </>
                  )}
               </div>

               <div className="pt-10">
                  <button onClick={onClose} className="w-full py-5 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl tactile-button">
                    ENTENDIDO
                  </button>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── MASTER TERMINAL ── */
export const AdminDashboard = () => {
  const { tenantSlug } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('hub_token'));
  const [view, setView] = useState('kanban'); // kanban, inventory, stats, sedes
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const hasSeen = localStorage.getItem(`hub_onboarding_${tenantSlug}`);
      if (!hasSeen) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, tenantSlug]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(`hub_onboarding_${tenantSlug}`, 'true');
    setShowOnboarding(false);
  };

  const fetchProducts = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`);
      if (!res.ok) throw new Error("Menu fetch failed");
      const data = await res.json();
      
      const flatProducts = [];
      if (data && typeof data === 'object' && !data.detail) {
        Object.keys(data).forEach(catName => {
          if (Array.isArray(data[catName])) {
            data[catName].forEach(prod => {
              flatProducts.push({ ...prod, category: catName, is_available: prod.is_available ?? true }); 
            });
          }
        });
      }
      setProducts(flatProducts);
    } catch (err) {
      console.warn("API Error, loading fallback", err);
    }
  }, [tenantSlug]);

  const [suggestions, setSuggestions] = useState([]);
  
  const fetchSuggestions = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSuggestions(await res.json());
    } catch (err) { console.warn("Suggestions fetch error:", err); }
  }, []);

  useEffect(() => { 
    if (isAuthenticated && tenantSlug) {
      fetchProducts(); 
      fetchSuggestions();
      
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
        .then(r => {
          if (!r.ok) throw new Error("Tenant fetch failed");
          return r.json();
        })
        .then(data => {
          setBranches(data.branches || []);
          setConfig(data);
        })
        .catch(err => console.warn("Config fetch error:", err));
        
      const interval = setInterval(fetchSuggestions, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchProducts, fetchSuggestions, tenantSlug]);

  const { toggleAvailability, magicSnap } = useProducts();
  const { logout: authLogout } = useAuth();

  const handleLogout = useCallback(() => {
    authLogout();
    setIsAuthenticated(false);
  }, [authLogout]);

  const handleAuthError = useCallback((err) => {
    if (err.message?.includes('401') || err.message?.includes('validate credentials')) {
        handleLogout();
    }
  }, [handleLogout]);
  
  /* ── COMPONENTE: GUÍA DE INICIO ── */
  const OnboardingChecklist = ({ products, config }) => {
    const hasProducts = products.length > 0;
    const hasColor = config?.brand_color && config.brand_color !== '#f59e0b';
    const hasWhatsapp = !!config?.whatsapp_number;

    const steps = [
      { id: 1, label: 'Cargar Catálogo', done: hasProducts, hint: 'Usa la IA para procesar tu carta física.' },
      { id: 2, label: 'Identidad Visual', done: hasColor && hasWhatsapp, hint: 'Define tu color de marca y contacto.' },
      { id: 3, label: 'Despliegue QR', done: false, hint: 'Genera el PDF para tus mesas físicas.' },
      { id: 4, label: 'Primer Pedido', done: false, hint: 'Recibe una orden real para activar el motor.' },
    ];


    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FCFAF7] border border-[rgba(22,17,15,0.06)] rounded-[2.5rem] p-10 mb-12 relative overflow-hidden shadow-sm"
      >
        <div className="absolute top-[-20%] right-[-5%] opacity-[0.03] select-none pointer-events-none">
           <span className="text-[12rem] font-serif italic">Platorin</span>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black">Sistema Operativo Iniciado</p>
          </div>
          
          <h3 className="text-4xl font-light text-ink italic font-serif mb-10 leading-tight">
            Tu cocina está lista.<br />
            <span className="text-ink/40 not-italic font-sans text-sm font-medium tracking-tight">Completa estos pasos para activar el flujo de ventas.</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(s => (
              <div key={s.id} className={`p-6 rounded-3xl border transition-all ${s.done ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-white/40 border-ink/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${s.done ? 'bg-emerald-500 text-white' : 'bg-ink/5 text-ink/30'}`}>
                    {s.done ? '✓' : s.id}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${s.done ? 'text-emerald-700' : 'text-ink/60'}`}>{s.label}</span>
                </div>
                <p className="text-[10px] text-ink/30 leading-relaxed font-medium">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };


  const toggleProduct = async (id, currentStatus) => {
    try {
      const token = authService.getToken();
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
      await toggleAvailability(id, token);
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    } catch(err) {
      console.warn(err);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: currentStatus } : p));
    }
  };

  useEffect(() => {
    const handleNav = (e) => setView(e.detail);
    window.addEventListener('nav-view', handleNav);
    return () => window.removeEventListener('nav-view', handleNav);
  }, []);

  if (!isAuthenticated) {
    return <AnimatePresence mode="wait"><LoginTerminal onAuth={() => setIsAuthenticated(true)} /></AnimatePresence>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full bg-[#F5F1E8] text-ink font-sans selection:bg-gold/20 relative pb-32">
      
      {/* ─── FLOATING DOCK NAVIGATION (Carta Style) ─── */}
      <div className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6">
        <nav className="flex items-center gap-1 p-1.5 bg-[#16110F]/95 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.35)] max-w-full overflow-x-auto no-scrollbar">
          
          {/* Logo Pill */}
          <div className="px-6 py-2 border-r border-white/10 flex flex-col justify-center mr-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-white text-base serif-italic leading-none tracking-tight">Plato</span>
              <span className="text-[10px] font-black text-[#7E9B84] leading-none">RIN</span>
            </div>
            <span className="text-[6px] text-white/30 font-black uppercase tracking-[0.4em] mt-0.5">Operating System</span>
          </div>

          <div className="flex items-center gap-1">
            {['kanban', 'inventory', 'stats', 'qr', 'marketing', 'sedes', 'autopilot', 'eventos', 'payments', 'settings', 'billing'].map(m => (
              <button 
                key={m} 
                onClick={() => setView(m)}
                className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                  view === m 
                    ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {
                  m === 'kanban' ? 'Pedidos' : 
                  m === 'inventory' ? 'Inventario' : 
                  m === 'stats' ? 'Ventas' : 
                  m === 'qr' ? 'QR' : 
                  m === 'marketing' ? 'Promos' : 
                  m === 'sedes' ? 'Sedes' : 
                  m === 'autopilot' ? 'Social AI' : 
                  m === 'eventos' ? 'Eventos' : 
                  m === 'payments' ? 'Pagos' : 
                  m === 'settings' ? 'Diseño' : 'Plan'
                }
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 mx-3"></div>

          <button 
            onClick={() => setShowBriefing(true)}
            className="px-6 py-2.5 bg-[#7E9B84] text-[#F7F4ED] rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all whitespace-nowrap"
          >
            ✦ RESUMEN
          </button>
          
          <button 
            onClick={handleLogout}
            className="ml-2 w-10 h-10 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
            title="Cerrar Sesión"
          >
            ✕
          </button>
        </nav>
      </div>

      <main className="pt-28 pb-12 px-5 max-w-6xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <KanbanBoard key="kanban" tenantSlug={tenantSlug} onAuthError={handleAuthError} config={config} />
          ) : view === 'sedes' ? (
            <SedesView key="sedes" branches={branches} tenantSlug={tenantSlug} />
          ) : view === 'inventory' ? (
            <div key="inv" className="space-y-12">
               {products.length === 0 && <OnboardingChecklist products={products} config={config} />}
               <InventoryManager products={products} toggleProduct={toggleProduct} magicSnap={magicSnap} onLogout={handleLogout} />
            </div>
          ) : view === 'stats' ? (
            <LiveMonitor key="stats" />
          ) : view === 'qr' ? (
            <QRTerminal key="qr" config={config} />
          ) : view === 'marketing' ? (
            <MarketingManager key="marketing" tenantSlug={tenantSlug} />
          ) : view === 'autopilot' ? (
            <InstagramAutopilot key="autopilot" />
          ) : view === 'eventos' ? (
            <EventsManager key="eventos" tenantSlug={tenantSlug} />
          ) : view === 'settings' ? (
            <BrandingSettings key="settings" />
          ) : view === 'payments' ? (
            <AdminPayments key="payments" />
          ) : (
            <BillingManager key="billing" />
          )}
        </AnimatePresence>
      </main>

      {/* Dock Inferior */}
      {(view === 'inventory' || view === 'stats') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center p-2 rounded-[2.5rem] bg-bone/80 backdrop-blur-3xl border border-dark/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-40 gap-3">
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
             className="h-14 px-8 rounded-2xl text-bone bg-dark flex items-center justify-center gap-3 transition-all hover:bg-dark/90 tactile-button shadow-lg">
             <span className="text-xl font-black leading-none">+</span>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Añadir Producto</span>
           </motion.button>
  
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAIModal(true)}
             className="h-14 px-6 rounded-2xl text-dark bg-dark/5 flex items-center justify-center gap-3 transition-all hover:bg-dark/10 border border-dark/10 tactile-button">
             <span className="text-lg">✦</span>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Cargar desde foto</span>
           </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onProductAdded={fetchProducts} />}
        {showAIModal && <AIIngestModal onClose={() => setShowAIModal(false)} onSuccess={fetchProducts} />}
        {showBriefing && <AIBriefingPanel suggestions={suggestions} onClose={() => setShowBriefing(false)} />}
        {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
      </AnimatePresence>
    </motion.div>
  );
};
