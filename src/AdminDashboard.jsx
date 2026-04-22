import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ProductCell } from './ProductCell';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { KanbanBoard } from './KanbanBoard';
import { MarketingManager } from './MarketingManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── BIOMETRIC LOGIN TERMINAL ── */
export const LoginTerminal = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) throw new Error('Credenciales Inválidas');
      const data = await res.json();
      
      localStorage.setItem('hub_token', data.access_token);
      localStorage.setItem('hub_role', data.role);
      localStorage.setItem('hub_tenant', data.tenant_slug || '');
      
      onAuth(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020202] flex flex-col items-center justify-center p-6 w-full fixed inset-0 z-[200]">
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[100%] pointer-events-none opacity-30 z-0">
         <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
         <div className="absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-screen bg-gradient-to-l from-amber-300/10 to-transparent"></div>
      </div>
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="absolute inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-48 h-48 flex items-center justify-center mb-8"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-amber-500/30 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-white/10 rounded-full"
        />
        <div className="text-center z-10">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="flex justify-center mb-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </motion.div>
          <h2 className="text-[10px] text-amber-500 uppercase tracking-[0.5em] font-black">Auth</h2>
        </div>
      </motion.div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-64">
        <input 
          type="text" 
          placeholder="USER_ID" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-transparent border-b border-white/20 py-2 text-center text-white tracking-[0.2em] outline-none focus:border-amber-500 transition-all font-mono"
        />
        <input 
          type="password" 
          placeholder="PASSCODE" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border-b border-white/20 py-2 text-center text-white tracking-[0.5em] outline-none focus:border-amber-500 transition-all font-mono"
        />
        {error && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black uppercase text-[10px] font-black tracking-widest transition-all rounded-full"
        >
          {loading ? 'Verificando...' : 'Enlazar'}
        </button>
      </form>
    </div>
  );
};

/* ── LIVE MONITOR (Analytics with WebSockets) ── */
export const LiveMonitor = ({ onLogout }) => {
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
          // Un cliente picó el botón '+' en el front!
          // Vibramos si hay feedback háptico (opcional)
          if (navigator.vibrate) navigator.vibrate(10);
          
          setStats(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(p => p.id === payload.product_id);
            if (idx >= 0) {
              copy[idx] = { ...copy[idx], hits: copy[idx].hits + 1 };
              // Reordenar por clics más altos
              copy.sort((a, b) => b.hits - a.hits);
              return copy;
            } else {
              // Si no estaba en el top local, mejor re-hacemos un fetch para no descincronizar
              // Retornar prev no activa reactividad, así que la promesa de abajo lo arregla
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
    return () => { if (ws) ws.close() };
  }, [fetchTopStats]);

  const totalFormat = (totalHits * 32000).toLocaleString('es-CO'); // Estimación de dinero base para HUD
  const topProduct = stats.length > 0 ? stats[0] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10"
    >
      <header className="mb-4 mt-4 flex justify-between items-end">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
          Live <br /><span className="text-amber-500">Monitor</span>
        </h2>
        <button onClick={onLogout} className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white/80 transition-colors">Logout / Salir</button>
      </header>

      {/* KPI Principal: Ventas del Día */}
      <div className="bg-gradient-to-br from-amber-500/20 to-transparent p-6 rounded-[2.5rem] border border-white/10">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Volumen de Pedidos (Estimado)</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black italic text-white">${totalFormat}</span>
          <span className="text-amber-500 text-[10px] font-mono whitespace-nowrap">+2% live</span>
        </div>
      </div>

      {/* Listado de "Hot Items" (Los más clickeados) */}
      <section>
        <h3 className="text-[10px] text-white/40 uppercase tracking-widest mb-6 px-2">Top Interacción Táctil (Tiempo Real)</h3>
        {stats.length === 0 && <p className="text-xs text-white/30 text-center italic">Esperando actividad...</p>}
        
        <div className="space-y-4">
          <AnimatePresence>
            {stats.map(item => {
              // Calculamos el % de llenado para la barra de energía
              const maxHits = topProduct ? topProduct.hits : 1;
              const fillPercent = Math.max(5, (item.hits / maxHits) * 100);
              
              return (
                <motion.div layout key={item.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter px-2">
                    <span>{item.name}</span>
                    <span className="text-white/40">{item.hits} Clics</span>
                  </div>
                  {/* Barra de energía estilo HUD */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      key={`bar-${item.id}-${item.hits}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
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

/* ── QR DEPLOYMENT TERMINAL (FASE 1) ── */
const QRTerminal = () => {
  const { tenantSlug } = useParams();
  const qrRef = React.useRef(null);
  const [table, setTable] = useState('');

  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `${tenantSlug}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Background
    pdf.setFillColor(5, 5, 5); 
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Titulo
    pdf.setTextColor(245, 158, 11);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Descubre nuestra Carta 4D", 105, 50, { align: "center" });

    // Subtitulo
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text("Escanea el código con la cámara de tu celular", 105, 65, { align: "center" });

    // QR Image
    pdf.addImage(imgData, 'PNG', 55, 90, 100, 100);

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Powered by HUB SaaS - tenant: ${tenantSlug}`, 105, 280, { align: "center" });

    pdf.save(`${tenantSlug}-kit-digital.pdf`);
  };
  const menuUrl = table ? `${window.location.origin}/t/${tenantSlug}?mesa=${table}` : `${window.location.origin}/t/${tenantSlug}`;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 flex flex-col items-center">
      <div className="text-center mt-4">
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">
          Terminal <span className="italic font-serif text-amber-500">QR</span>
        </h2>
        <p className="text-[10px] text-white/40 font-light leading-relaxed tracking-wider uppercase">
          Despliegue Físico
        </p>
      </div>
      <div className="w-full max-w-xs mb-4">
        <input 
          type="text" 
          placeholder="Número de Mesa (Opcional)" 
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-center outline-none focus:border-amber-500 transition-colors placeholder-white/30"
        />
        <p className="text-[9px] text-white/30 text-center uppercase tracking-widest mt-2">{table ? `Generando QR Dinámico para Mesa ${table}` : 'QR General (Sin mesa asignada)'}</p>
      </div>

      <div  
        ref={qrRef} 
        className="bg-white p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center gap-6"
        style={{ border: '4px solid #f59e0b' }}
      >
        <QRCodeSVG 
          value={menuUrl} 
          size={220}
          bgColor={"#ffffff"}
          fgColor={"#050505"}
          level={"Q"}
          imageSettings={{
            src: "/logo.png",
            x: undefined,
            y: undefined,
            height: 50,
            width: 50,
            excavate: true,
          }}
        />
        <p className="text-xs uppercase tracking-[0.4em] font-black text-black">
          ESCANEA AQUÍ
        </p>
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button onClick={handleDownloadPNG} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] uppercase tracking-widest hover:bg-white/10 transition-colors">
          ↓ Bajar PNG
        </button>
        <button onClick={handleDownloadPDF} className="flex-1 py-4 bg-amber-500 text-black font-black flex items-center justify-center gap-2 rounded-2xl text-[9px] uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] transition-transform">
          📄 Print Kit PDF
        </button>
      </div>
    </motion.div>
  );
};

/* ── COMPONENTS (Colecciones) ── */
const InventoryManager = ({ products, toggleProduct, onLogout }) => {
  const { tenantSlug } = useParams();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      
      <header className="mb-12 pt-8 pb-6 border-b border-white/10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-white/40 uppercase font-light mb-3 flex items-center gap-3">
              <span className="w-5 h-px bg-amber-500/50"></span> {(tenantSlug || 'DASHBOARD').toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 text-[9px] font-mono tracking-[0.15em] uppercase bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-white/40">ADMIN: <span className="text-white font-medium ml-2">{localStorage.getItem('hub_tenant') || window.location.pathname.split("/")[2]?.toUpperCase()}</span></p>
            <p className="text-white/40">STATUS: <span className="text-amber-500 font-bold ml-2">LINKED_SECURE</span></p>
            <p className="text-white/40">ROLE: <span className="text-white/80 ml-2">{localStorage.getItem('hub_role') || 'ADMIN'}</span></p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="max-w-[300px]">
            <h2 className="text-2xl font-light tracking-tight text-white">
              Gestión de <span className="italic font-serif text-amber-500">Colecciones</span>
            </h2>
            <p className="text-[10px] text-white/40 mt-2 font-light leading-relaxed tracking-wider">
              Control de sincronización y disponibilidad en el ecosistema.
            </p>
          </div>
          <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/50 hover:text-amber-500 transition-colors border border-amber-500/20 px-5 py-2.5 rounded-full hover:bg-amber-500/10">
            Desconectar
          </button>
        </div>
      </header>
      
      {products.length === 0 && (
        <div className="text-center p-8 text-white/30 uppercase tracking-widest text-[10px]">
          Sincronizando base de datos...
        </div>
      )}

      {products.map((item) => (
        <div key={item.id} className="group relative bg-white/[0.03] border border-white/5 p-4 rounded-[2.5rem] flex items-center gap-4 transition-all hover:bg-white/[0.07]">
          <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl bg-zinc-800/80 overflow-hidden transition-all duration-500 ${!item.is_available ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}>
            {item.image || item.image_url ? (
              <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{item.emoji || '🍽️'}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
               <h3 className={`text-xs font-bold uppercase tracking-wide truncate transition-colors ${!item.is_available ? 'text-white/40 line-through' : 'text-white'}`}>
                 {item.name}
               </h3>
               {/* Trend Indicator Icon */}
               {item.is_available && item.id % 3 === 0 && <span className="text-[10px]" title="Trending 🔥">🔥</span>}
            </div>
            <p className="text-[10px] text-white/30 font-mono mt-1">{item.price}</p>
          </div>
          {/* Kill-Switch */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={item.is_available} onChange={() => toggleProduct(item.id, item.is_available)} />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/30 peer-checked:after:bg-amber-500 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/20"></div>
            </label>
            <span className={`text-[8px] uppercase tracking-tighter ${item.is_available ? 'text-amber-500/80 shadow-amber-500' : 'text-red-500/80'}`}>
              {item.is_available ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

/* ── BRANDING EDITOR (FASE 2) ── */
const BrandingSettings = () => {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand_color: '#f59e0b',
    whatsapp_number: '',
    instagram_url: '',
    tiktok_url: '',
    maps_url: '',
  });

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(r => r.json())
      .then(d => {
        setFormData({
          brand_color: d.brand_color || '#f59e0b',
          whatsapp_number: d.whatsapp_number || '',
          instagram_url: d.instagram_url || '',
          tiktok_url: d.tiktok_url || '',
          maps_url: d.maps_url || ''
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Guardado falló");
      alert("Marca actualizada con éxito. Cambios lanzados vía Live-Socket.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-light text-white mb-2 tracking-tight">Cero <span className="text-amber-500 font-serif italic">Soporte</span></h2>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Autogestión de Settings Corporativos</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 space-y-6">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500">Color Primario (Tema de Interfaz)</label>
             <div className="flex items-center gap-4">
               <div className="relative group overflow-hidden w-12 h-12 rounded-full border-2 border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95 ring-offset-2 ring-offset-[#020202] focus-within:ring-2 ring-amber-500">
                 <input 
                    type="color" 
                    value={formData.brand_color} 
                    onChange={(e) => setFormData({...formData, brand_color: e.target.value})} 
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer bg-transparent border-none p-0 outline-none"
                 />
                 <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"></div>
               </div>
               <span className="text-[10px] font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{formData.brand_color.toUpperCase()}</span>
             </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Línea WhatsApp de Pedidos</label>
             <input type="text" value={formData.whatsapp_number} onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-amber-500 outline-none" placeholder="ej: 573000000000" />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Google Maps URL</label>
             <input type="text" value={formData.maps_url} onChange={(e) => setFormData({...formData, maps_url: e.target.value})} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-amber-500 outline-none" placeholder="https://maps.google.com/..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Instagram</label>
               <input type="text" value={formData.instagram_url} onChange={(e) => setFormData({...formData, instagram_url: e.target.value})} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-amber-500 outline-none" placeholder="@usuario" />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">TikTok</label>
               <input type="text" value={formData.tiktok_url} onChange={(e) => setFormData({...formData, tiktok_url: e.target.value})} className="bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-amber-500 outline-none" placeholder="@usuario" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 text-[10px] uppercase tracking-widest font-black text-black rounded-[2rem] hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]" style={{ background: '#f59e0b' }}>
          {loading ? 'Aplicando...' : 'Desplegar Globalmente'}
        </button>
      </form>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-light text-white mb-2 tracking-tight">Facturación & <span className="text-amber-500 font-serif italic">Planes</span></h2>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Pago y Control de tu Sistema HUB SaaS</p>
      </header>
      
      <div className={`p-6 rounded-3xl border flex flex-col items-center text-center gap-4 ${isSuspended ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        <span className="text-4xl">{isSuspended ? '⚠️' : '✅'}</span>
        <div>
          <h3 className={`text-xl font-bold uppercase tracking-widest ${isSuspended ? 'text-red-500' : 'text-emerald-500'}`}>
             {isSuspended ? 'Supendido' : 'Activo'}
          </h3>
          <p className="text-[10px] text-white/50 tracking-wider">
             Vence: {bData.valid_until ? new Date(bData.valid_until).toLocaleDateString() : 'ILIMITADO (Lifetime)'}
          </p>
        </div>
        {isSuspended && <p className="text-xs text-white/80 max-w-sm">Tu carta digital está bloqueada para tus clientes. Renueva de inmediato para reactivar tus ventas.</p>}
      </div>

      <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/10 flex flex-col items-center">
         <div className="text-center mb-6">
            <span className="text-4xl font-black italic tracking-tighter text-white select-none">
              $35<span className="text-sm font-normal text-amber-500/80">/mes</span>
            </span>
         </div>
         <button onClick={handleSubscribe} className="w-full py-4 uppercase font-black tracking-widest text-[10px] rounded-full hover:scale-[1.02] transition-transform flex justify-center items-center gap-2" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#000', boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}>
            <span className="text-sm">💳</span> Pagar Renovación Segura
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#050505] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 w-full max-w-5xl relative z-10 flex flex-col xl:flex-row gap-8 sm:max-h-[90vh] h-[95vh] sm:h-auto overflow-y-auto">
        
        {/* PANEL IZQUIERDO: Editor de Contenido */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-amber-500">Nuevo Enlace</h3>
            <button type="button" onClick={handleMagicEdit} disabled={aiGenerating} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all">
               {aiGenerating ? 'Optimizando...' : '🪄 Magic AI Edit'}
            </button>
          </div>

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Transmisión Visual (Foto)</label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                className="w-full text-xs file:bg-amber-500/10 file:text-amber-500 file:border file:border-amber-500/20 file:px-4 file:py-2 file:rounded-full file:font-bold file:cursor-pointer" />
            </div>

            <div className="flex gap-3">
              <input value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })} title="Emoji representative"
                className="w-14 text-center text-xl bg-transparent border-b border-white/10 py-3 outline-none focus:border-amber-500 transition-colors" />
              <input placeholder="Nombre del Plato" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 bg-transparent border-b border-white/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Precio (EJ: $25k)" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="bg-transparent border-b border-white/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/20" />
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="bg-transparent border-b border-white/10 py-3 text-sm outline-none focus:border-amber-500 transition-colors text-white/70" style={{ background: '#050505' }}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <textarea placeholder="Describe el plato de forma tentadora..." value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })}
              className="w-full bg-transparent border border-white/10 p-4 rounded-2xl text-xs h-32 outline-none focus:border-amber-500 transition-colors resize-none placeholder-white/20" />
          </form>
        </div>

        {/* PANEL DERECHO: Simulador iOS (Live Preview) */}
        <div className="hidden sm:flex flex-col items-center justify-center bg-black/50 p-6 border border-white/5 rounded-3xl relative overflow-hidden flex-shrink-0 w-[400px]">
           <div className="absolute top-4 left-4 flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-amber-500"></div><div className="w-2 h-2 rounded-full bg-green-500"></div></div>
           <p className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-6 absolute top-4">Live Emulator</p>
           
           <div className="w-[320px] rounded-[2rem] border-[4px] border-zinc-900 bg-black overflow-hidden shadow-2xl relative">
              {/* Fake iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-50"></div>
              
              <div className="p-4 pt-10 min-h-[160px] flex items-center justify-center relative z-10" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.1) 0%, #000 100%)' }}>
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
        className="fixed bottom-6 z-[110] w-[90%] sm:w-[400px] py-4 rounded-full font-black uppercase tracking-widest text-sm text-black shadow-2xl transition-all"
        style={{ background: loading ? '#b45309' : '#f59e0b', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}>
        {loading ? 'Inyectando...' : 'Guardar y Publicar'}
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#050505] border border-amber-500/20 rounded-[2rem] p-8 w-full max-w-sm relative overflow-y-auto max-h-[90vh] shadow-2xl">
        {loading && <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="absolute -inset-10 bg-amber-500/10 blur-[50px] pointer-events-none" />}
        
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white flex items-center gap-2">
          <span className="text-amber-500">✦</span> Agente Migrador AI
        </h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">Convierte tu menú impreso en datos operacionales.</p>
        
        <div className="space-y-4 relative z-10">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="w-full text-xs text-white/50 file:bg-white/5 file:text-white file:border-none file:px-4 file:py-3 file:rounded-xl file:cursor-pointer outline-none" />
          
          <div className="flex gap-2 mt-6">
            <button onClick={onClose} disabled={loading} className="flex-1 py-3 bg-white/5 text-white/50 uppercase text-[9px] font-bold rounded-xl tracking-widest hover:bg-white/10">Cancelar</button>
            <button onClick={handleIngest} disabled={loading} className="flex-1 py-3 font-bold uppercase tracking-widest text-[9px] text-black rounded-xl" style={{ background: loading ? '#b45309' : '#f59e0b' }}>
              {loading ? 'Procesando...' : 'Migrar Ahora'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── MASTER TERMINAL ── */
export const AdminDashboard = () => {
  const { tenantSlug } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('kanban'); // kanban, inventory, stats
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`);
      const data = await res.json();
      const flatProducts = [];
      Object.keys(data).forEach(catName => {
        data[catName].forEach(prod => {
          flatProducts.push({ ...prod, category: catName, is_available: true }); 
        });
      });
      setProducts(flatProducts);
    } catch (err) {
      console.warn("API Error, loading fallback", err);
    }
  }, [tenantSlug]);

  useEffect(() => { 
    if (isAuthenticated) fetchProducts(); 
  }, [isAuthenticated, fetchProducts]);

  const toggleProduct = async (id, currentStatus) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/products/${id}/toggle`, { 
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Toggle failed");
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    } catch(err) {
      console.warn(err);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: currentStatus } : p));
    }
  };

  if (!isAuthenticated) {
    return <AnimatePresence mode="wait"><LoginTerminal onAuth={() => setIsAuthenticated(true)} /></AnimatePresence>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full bg-[#020202] text-white font-sans selection:bg-amber-500/30 relative pb-32">
      
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none opacity-30 z-0">
         <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
         <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-screen bg-gradient-to-l from-amber-300/10 to-transparent"></div>
      </div>
      
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="fixed inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex flex-nowrap items-center bg-[#020202]/85 backdrop-blur-2xl border-b border-white/10 overflow-x-auto no-scrollbar touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Shadow Overlay for scroll hint */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#020202] to-transparent pointer-events-none md:hidden" />
        
        <div className="flex-shrink-0 mr-8 relative z-10">
          <img src="/logo.png" alt="HUB" className="h-5 lg:h-6 object-contain" style={{ filter: 'brightness(1.5)', mixBlendMode: 'screen' }} />
        </div>
        <div className="flex gap-8 flex-shrink-0 whitespace-nowrap pr-12">
          {['kanban', 'inventory', 'stats', 'qr', 'marketing', 'settings', 'billing'].map(m => (
            <button key={m} onClick={() => setView(m)}
              className={`text-[10px] font-bold uppercase tracking-[0.22em] transition-all relative py-2 ${view === m ? 'text-amber-500' : 'text-white/30 hover:text-white/80'}`}>
              {m === 'kanban' ? 'Pedidos Live' : m === 'inventory' ? 'Suministros' : m === 'stats' ? 'Monitor' : m === 'qr' ? 'Punto QR' : m === 'marketing' ? 'Marketing AI' : m === 'settings' ? 'Branding' : 'Billing'}
              {view === m && (
                <motion.div 
                  layoutId="hud-nav" 
                  className="absolute -bottom-1 left-0 h-0.5 bg-amber-500 w-full shadow-[0_0_12px_rgba(245,158,11,0.9)]" 
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-5 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <KanbanBoard key="kanban" tenantSlug={tenantSlug} />
          ) : view === 'inventory' ? (
            <InventoryManager key="inv" products={products} toggleProduct={toggleProduct} onLogout={() => setIsAuthenticated(false)} />
          ) : view === 'stats' ? (
            <LiveMonitor key="stats" onLogout={() => setIsAuthenticated(false)} />
          ) : view === 'qr' ? (
            <QRTerminal key="qr" />
          ) : view === 'marketing' ? (
            <MarketingManager key="marketing" tenantSlug={tenantSlug} />
          ) : view === 'settings' ? (
            <BrandingSettings key="settings" />
          ) : (
            <BillingManager key="billing" />
          )}
        </AnimatePresence>
      </main>

      {/* Dock Inferior */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center p-1.5 rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl z-40 gap-1.5">
         <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
           className="h-12 px-6 rounded-2xl text-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
           style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
           <span className="text-xl font-black leading-none">+</span>
           <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Añadir Carga</span>
         </motion.button>

         <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAIModal(true)}
           className="h-12 px-4 rounded-2xl text-amber-500 bg-amber-500/10 flex items-center justify-center gap-2 transition-all hover:bg-amber-500/20 border border-amber-500/20">
           <span className="text-lg">✦</span>
           <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Migrar con IA</span>
         </motion.button>
      </div>

      <AnimatePresence>
        {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onProductAdded={fetchProducts} />}
        {showAIModal && <AIIngestModal onClose={() => setShowAIModal(false)} onSuccess={fetchProducts} />}
      </AnimatePresence>
    </motion.div>
  );
};
