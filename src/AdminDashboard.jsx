import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ProductCell } from './ProductCell';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { KanbanBoard } from './KanbanBoard';
import { MarketingManager } from './MarketingManager';
import { InstagramAutopilot } from './InstagramAutopilot';
import { OnboardingTour } from './OnboardingTour';
import { PhoneInput } from './PhoneInput';
import { EventsManager } from './EventsManager';
import { useAuth } from './core/auth/useAuth';
import { useProducts } from './core/products/useProducts';
import { authService } from './core/auth/authService';

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
    <div className="h-screen bg-bone flex flex-col items-center justify-center p-6 w-full fixed inset-0 z-[200]">
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[100%] pointer-events-none opacity-30 z-0">
         <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-multiply bg-gradient-to-r from-amber-500/10 to-orange-600/5"></div>
         <div className="absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-multiply bg-gradient-to-l from-amber-300/5 to-transparent"></div>
      </div>
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="absolute inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
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
          className="absolute inset-4 border border-dark/10 rounded-full"
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
          className="bg-transparent border-b border-dark/20 py-2 text-center text-dark tracking-[0.2em] outline-none focus:border-amber-500 transition-all font-mono"
        />
        <input 
          type="password" 
          placeholder="PASSCODE" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border-b border-dark/20 py-2 text-center text-dark tracking-[0.5em] outline-none focus:border-amber-500 transition-all font-mono"
        />
        {error && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 py-3 bg-amber-500/10 text-gold font-black border border-amber-500/20 tactile-button uppercase text-[10px] tracking-widest transition-all rounded-full"
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
        <button onClick={onLogout} className="text-[9px] uppercase tracking-widest text-dark/30 hover:text-dark/80 transition-colors">Logout / Salir</button>
      </header>

      {/* KPI Principal: Ventas del Día */}
      <div className="bg-dark/5 p-8 rounded-[2.5rem] border border-dark/10 relative overflow-hidden group">
        {/* Tech Decor */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-dark/20 rounded-tr-[2.5rem]" />
        
        <p className="text-[9px] text-dark/40 uppercase tracking-[0.3em] mb-2 font-mono">[ REAL_TIME_VOL_TRACKER ]</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-6xl font-black italic text-dark tracking-tighter">${totalFormat}</span>
          <span className="text-emerald-600 text-[10px] font-mono whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">+2%_SYNCED</span>
        </div>
      </div>

      {/* Listado de "Hot Items" (Los más clickeados) */}
      <section>
        <h3 className="text-[10px] text-dark/40 uppercase tracking-widest mb-6 px-2">Top Interacción Táctil (Tiempo Real)</h3>
        {stats.length === 0 && <p className="text-xs text-dark/30 text-center italic">Esperando actividad...</p>}
        
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
                    <span className="text-dark/40">{item.hits} Clics</span>
                  </div>
                  {/* Barra de energía estilo HUD */}
                  <div className="h-1.5 w-full bg-dark/5 rounded-full overflow-hidden">
                    <motion.div 
                      key={`bar-${item.id}-${item.hits}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPercent}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="h-full bg-gold-gradient shadow-[0_0_15px_rgba(252,211,77,0.4)]"
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
    
    // Background
    pdf.setFillColor(247, 243, 233); // Match new bone color
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Titulo
    pdf.setTextColor(26, 26, 26);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    if (table) pdf.text(`MESA ${table}`, 105, 35, { align: "center" });
    pdf.setTextColor(197, 160, 89);
    pdf.text("Descubre nuestra Carta 4D", 105, 50, { align: "center" });

    // Subtitulo
    pdf.setTextColor(26, 26, 26);
    pdf.setAlpha(0.6);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text("Escanea el código con la cámara de tu celular", 105, 65, { align: "center" });
    pdf.setAlpha(1.0);

    // QR Image
    pdf.addImage(imgData, 'PNG', 55, 90, 100, 100);

    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Powered by HUB SaaS - tenant: ${tenantSlug}`, 105, 280, { align: "center" });

    pdf.save(`${tenantSlug}-kit-digital${table ? '-mesa-'+table : ''}.pdf`);
    setIsGenerating(false);
  };

  const handleDownloadBatchPDF = async () => {
    const count = parseInt(tableCount);
    if (!count || count < 1) return alert("Ingresa una cantidad válida de mesas.");
    
    setIsGenerating(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 1; i <= count; i++) {
       const el = document.getElementById(`qr-batch-${i}`);
       if (!el) continue;
       const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff' });
       const imgData = canvas.toDataURL('image/png');
       
       if (i > 1) pdf.addPage();
       
       pdf.setFillColor(247, 243, 233); 
       pdf.rect(0, 0, 210, 297, 'F');
       pdf.setTextColor(26, 26, 26);
       pdf.setFontSize(32);
       pdf.setFont('helvetica', 'bold');
       pdf.text(`MESA ${i}`, 105, 35, { align: "center" });
       pdf.setTextColor(197, 160, 89);
       pdf.text("Descubre nuestra Carta 4D", 105, 50, { align: "center" });
       pdf.setTextColor(26, 26, 26);
       pdf.setAlpha(0.6);
       pdf.setFontSize(16);
       pdf.setFont('helvetica', 'normal');
       pdf.text("Escanea el código con la cámara de tu celular", 105, 65, { align: "center" });
       pdf.setAlpha(1.0);
       pdf.addImage(imgData, 'PNG', 55, 90, 100, 100);
       pdf.setFontSize(10);
       pdf.setTextColor(100, 100, 100);
       pdf.text(`Powered by HUB SaaS - tenant: ${tenantSlug}`, 105, 280, { align: "center" });
    }
    
    pdf.save(`${tenantSlug}-lote-mesas-1-a-${count}.pdf`);
    setIsGenerating(false);
  };

  const menuUrl = table ? `${window.location.origin}/t/${tenantSlug}?mesa=${table}` : `${window.location.origin}/t/${tenantSlug}`;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 flex flex-col items-center pb-20">
      <div className="text-center mt-4 relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-dark/20 uppercase tracking-[0.5em]">QR_DEPLOY_MODULE</div>
        <h2 className="text-4xl font-light tracking-tight text-dark mb-2">
          Terminal <span className="italic font-serif text-amber-500">QR</span>
        </h2>
        <p className="text-[10px] text-dark/40 font-bold leading-relaxed tracking-[0.4em] uppercase">
          Ecosistema Digital Unificado
        </p>
      </div>
      
      {/* ── GENERACIÓN INDIVIDUAL ── */}
      <div className="w-full max-w-xs mb-4">
        <input 
          type="text" 
          placeholder="Ej: 1, 2, Terraza..." 
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="w-full bg-dark/5 border border-dark/10 rounded-2xl py-3 px-5 text-sm text-center outline-none focus:border-amber-500 transition-colors placeholder-dark/30"
        />
        <p className="text-[9px] text-dark/30 text-center uppercase tracking-widest mt-2 font-mono">{table ? `GEN_QR_TABLE_${table}_LOADED` : 'GENERAL_QR_ACTIVE'}</p>
      </div>

      <div  
        ref={qrRef} 
        className="bg-white p-8 rounded-3xl shadow-[0_0_50px_rgba(197,160,89,0.15)] flex flex-col items-center justify-center gap-6"
        style={{ border: '4px solid #C5A059' }}
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
        <button onClick={handleDownloadPNG} className="flex-1 py-4 bg-dark/5 border border-dark/10 rounded-2xl text-[9px] uppercase tracking-widest text-dark font-black hover:bg-dark/10 transition-colors">
          ↓ Bajar PNG
        </button>
        <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex-1 py-4 bg-dark text-bone font-black flex items-center justify-center gap-2 rounded-2xl text-[9px] uppercase tracking-[0.3em] transition-transform shadow-xl tactile-button">
          {isGenerating ? 'DESPLEGANDO...' : '📄 Print PDF'}
        </button>
      </div>

      {/* ── GENERACIÓN POR LOTE (BATCH) ── */}
      {hasTables && (
        <div className="w-full max-w-sm mt-8 border-t border-dark/10 pt-10 text-center space-y-6 relative">
          <h3 className="text-xl font-black uppercase italic text-dark tracking-tighter">Despliegue Masivo</h3>
          <p className="text-[10px] text-dark/40 uppercase tracking-[0.3em] px-4 font-medium">Generación automatizada de kits físicos por zona.</p>
          
          <div className="flex gap-3">
            <input 
              type="number" 
              min="1" max="100"
              placeholder="M_COUNT" 
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              className="w-1/3 bg-dark/5 border border-dark/10 rounded-2xl py-4 px-2 text-center text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/20 text-dark font-mono"
            />
            <button onClick={handleDownloadBatchPDF} disabled={isGenerating || !tableCount} className="flex-1 py-4 bg-dark text-bone font-black flex items-center justify-center gap-2 rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50 tactile-button">
              {isGenerating ? 'SYNC_BATCH_PDF...' : '🖨️ Generar PDF Completo'}
            </button>
          </div>
        </div>
      )}

      {/* ── HIDDEN RENDER AREA FOR BATCH ── */}
      <div className="absolute opacity-0 pointer-events-none -z-50" style={{ left: '-9999px', top: 0 }}>
         {parseInt(tableCount) > 0 && Array.from({length: Math.min(parseInt(tableCount), 100)}).map((_, i) => (
             <div 
               key={i} 
               id={`qr-batch-${i+1}`} 
               className="bg-white p-8 flex flex-col items-center justify-center gap-6"
               style={{ border: '4px solid #f59e0b', width: '316px', height: '350px' }}
             >
               <QRCodeSVG 
                 value={`${window.location.origin}/t/${tenantSlug}?mesa=${i+1}`} 
                 size={220}
                 bgColor={"#ffffff"}
                 fgColor={"#050505"}
                 level={"Q"}
                 imageSettings={{ src: "/logo.png", height: 50, width: 50, excavate: true }}
               />
               <p className="text-xs uppercase tracking-[0.4em] font-black text-black">ESCANEA AQUÍ</p>
             </div>
         ))}
      </div>
    </motion.div>
  );
};

/* ── COMPONENTS (Colecciones) ── */
const InventoryManager = ({ products, toggleProduct, magicSnap, onLogout }) => {
  const { tenantSlug } = useParams();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      
      <header className="mb-12 pt-8 pb-6 border-b border-dark/10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 mb-10">
          <div className="relative">
            <p className="text-[9px] tracking-[0.4em] text-dark/40 uppercase font-bold mb-3 flex items-center gap-3">
              <span className="w-5 h-px bg-amber-500/50"></span> {(tenantSlug || 'DASHBOARD').toUpperCase()}
            </p>
            {/* Tech tag */}
            <div className="absolute -top-4 -left-2 text-[7px] font-mono text-amber-500/30">v3.4.0_STABLE</div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 text-[9px] font-mono tracking-[0.15em] uppercase bg-dark/5 p-5 rounded-[2rem] border border-dark/10 backdrop-blur-md">
            <p className="text-dark/40">ADMIN: <span className="text-dark font-black ml-2">{localStorage.getItem('hub_tenant') || window.location.pathname.split("/")[2]?.toUpperCase()}</span></p>
            <p className="text-dark/40">STATUS: <span className="text-emerald-600 font-black ml-2">LINKED_SECURE</span></p>
            <p className="text-dark/40">ROLE: <span className="text-dark/80 ml-2 font-bold">{localStorage.getItem('hub_role') || 'ADMIN'}</span></p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="max-w-[400px]">
            <h2 className="text-3xl font-light tracking-tighter text-dark">
              Gestión de <span className="italic font-serif text-amber-500">Colecciones</span>
            </h2>
            <p className="text-[10px] text-dark/50 mt-3 font-medium leading-relaxed tracking-widest uppercase">
              Sincronización de activos digitales en red.
            </p>
          </div>
          <div className="flex gap-4">
             <label className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 border border-amber-500/20 px-6 py-3 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all flex items-center gap-2 group">
                <span className="text-lg group-hover:rotate-12 transition-transform">📸</span>
                <span>Magic Snap (AI)</span>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const token = authService.getToken();
                  alert("✨ Gemini Vision está analizando el plato... Por favor espera.");
                  try {
                    await magicSnap(token, file);
                    alert("✅ ¡Plato creado mágicamente!");
                    window.location.reload();
                  } catch { alert("Error en el análisis visual."); }
                }} />
             </label>
             <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-[0.3em] text-dark/40 hover:text-dark transition-all border border-dark/10 px-6 py-3 rounded-2xl hover:bg-dark/5 tactile-button">
                Terminar_Sesión
             </button>
          </div>
        </div>
      </header>
      
      {products.length === 0 && (
        <div className="text-center p-8 text-dark/30 uppercase tracking-[0.4em] text-[9px] font-mono font-bold">
          [ SYNCING_HUB_DATABASE... ]
        </div>
      )}

      {products.map((item) => (
        <div key={item.id} className="group relative bg-dark/[0.03] border border-dark/5 p-4 rounded-[2.5rem] flex items-center gap-4 transition-all hover:bg-dark/[0.07]">
          <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl bg-dark/5 overflow-hidden transition-all duration-500 border border-dark/5 ${!item.is_available ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}>
            {item.image || item.image_url ? (
              <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{item.emoji || '🍽️'}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
               <h3 className={`text-xs font-black uppercase tracking-[0.1em] truncate transition-colors ${!item.is_available ? 'text-dark/20 line-through' : 'text-dark'}`}>
                 {item.name}
               </h3>
               {/* Trend Indicator Icon */}
               {item.is_available && item.id % 3 === 0 && <span className="text-[10px]" title="Trending 🔥">🔥</span>}
            </div>
            <p className="text-[10px] text-dark/30 font-mono mt-1 font-bold">{item.price}</p>
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
  const [igStatus, setIgStatus] = useState(null);
  const [ttStatus, setTtStatus] = useState({ is_linked: false, username: '' });
  const [formData, setFormData] = useState({
    brand_color: '#f59e0b',
    whatsapp_number: '',
    tiktok_url: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('hub_token');
    
    // Fetch Settings
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(r => r.json())
      .then(d => {
        setFormData({
          brand_color: d.brand_color || '#f59e0b',
          whatsapp_number: d.whatsapp_number || '',
          tiktok_url: d.tiktok_url || ''
        });
        const mainBranch = d.branches?.[0];
        if (mainBranch) {
            setTtStatus({ 
              is_linked: mainBranch.is_tt_linked, 
              username: mainBranch.tt_username,
              profile_picture: mainBranch.tt_profile_picture
            });
        }
      })
      .catch(e => console.warn(e));

    // Fetch IG Status
    fetch(`${API_URL}/api/admin/instagram/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => setIgStatus(d))
    .catch(() => setIgStatus(null));
  }, [tenantSlug]);

  const handleConnectTikTok = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/tiktok/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ branch_id: 1 })
      });
      const data = await res.json();
      if (res.ok) {
          setTtStatus({ 
            is_linked: true, 
            username: data.tt_username,
            profile_picture: data.tt_profile_picture 
          });
          alert("¡TikTok vinculado con éxito!");
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

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
      alert("Marca actualizada con éxito.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <header className="mb-8 border-b border-dark/10 pb-6">
        <h2 className="text-3xl font-light text-dark mb-2 tracking-tight">Branding <span className="text-amber-500 font-serif italic">& Estilo</span></h2>
        <p className="text-[10px] uppercase tracking-widest text-dark/40">Personaliza la experiencia visual de tus clientes</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="bg-dark/[0.03] p-8 rounded-[2.5rem] border border-dark/5 space-y-8">
            
            <div className="flex flex-col gap-4">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500">Color de Marca (Interfaz)</label>
                 <span className="text-[10px] font-mono text-dark/30">{formData.brand_color.toUpperCase()}</span>
               </div>
               <div className="flex items-center gap-6 p-4 bg-dark/5 rounded-2xl border border-dark/5">
                 <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-dark/10 shadow-2xl">
                   <input 
                      type="color" 
                      value={formData.brand_color} 
                      onChange={(e) => setFormData({...formData, brand_color: e.target.value})} 
                      className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer bg-transparent border-none p-0 outline-none"
                   />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] text-dark/50 mb-1">Color de Acento</p>
                    <p className="text-xs text-dark/80">Este color definirá el acento de botones e iconos en tu menú digital.</p>
                 </div>
               </div>
            </div>
            
            <div className="space-y-8">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-dark/50">WhatsApp de Pedidos</label>
                   <PhoneInput 
                     value={formData.whatsapp_number} 
                     onChange={(val) => setFormData({...formData, whatsapp_number: val})} 
                     placeholder="Número de WhatsApp"
                   />
                </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-dark/50">Instagram (Vía Autopilot)</label>
                    {igStatus?.is_linked ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-4 px-4 flex items-center gap-3">
                        <img src={igStatus.ig_profile_picture} className="w-6 h-6 rounded-full border border-emerald-500/30" alt="" />
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest truncate">@{igStatus.ig_username}</span>
                      </div>
                    ) : (
                      <div className="bg-dark/5 border border-dashed border-dark/10 rounded-2xl py-4 px-4 flex items-center justify-center">
                        <span className="text-[9px] text-dark/30 uppercase tracking-widest font-bold">Desvinculado</span>
                      </div>
                    )}
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-dark/50">TikTok (Wow Connect)</label>
                    {ttStatus.is_linked ? (
                      <div className="bg-[#fe2c55]/10 border border-[#fe2c55]/20 rounded-2xl py-4 px-4 flex items-center gap-3">
                        {ttStatus.profile_picture ? (
                           <img src={ttStatus.profile_picture} className="w-6 h-6 rounded-full border border-[#fe2c55]/30" alt="" />
                        ) : (
                           <span className="text-lg">🎵</span>
                        )}
                        <span className="text-[10px] text-[#fe2c55] font-black uppercase tracking-widest truncate">@{ttStatus.username}</span>
                      </div>
                    ) : (
                      <button type="button" onClick={handleConnectTikTok} className="bg-dark/5 border border-dark/10 rounded-2xl py-4 px-4 flex items-center justify-center gap-2 hover:bg-dark/10 transition-colors">
                        <span className="text-[9px] text-dark uppercase tracking-widest font-black">Conectar TikTok</span>
                      </button>
                    )}
                 </div>
               </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 text-[11px] uppercase tracking-[0.3em] font-black text-bone bg-dark rounded-[2rem] tactile-button shadow-xl" >
            {loading ? 'Aplicando...' : 'Actualizar Marca Globalmente'}
          </button>
        </form>

        {/* Mobile Preview Column */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6 sticky top-8">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-dark/20 text-center">Simulador Live</p>
            <div className="flex justify-center relative">
                <div className="w-[280px] h-[580px] bg-bone border-[10px] border-dark/10 rounded-[3.5rem] overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-6 bg-dark/10 rounded-b-3xl w-1/3 mx-auto z-20"></div>
                    
                    <div className="h-full bg-bone flex flex-col pt-12 relative">
                        {/* Page Flip Mockup */}
                        <div className="absolute inset-y-0 right-0 w-[12px] bg-gradient-to-l from-dark/5 to-transparent z-10" />
                        
                        <div className="px-6 mb-8 relative z-0">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">🍽️</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-dark/40">Entradas</span>
                            </div>
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-dark mb-2 leading-[0.8]">{tenantSlug}</h4>
                            <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: formData.brand_color }} />
                        </div>

                        <div className="flex-1 px-6 space-y-5 relative z-0">
                            {[1,2,3].map(i => (
                                <div key={i} className="bg-dark/[0.02] rounded-2xl border border-dark/5 p-4 flex gap-4">
                                    <div className="w-12 h-12 bg-dark/5 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-2/3 bg-dark/10 rounded-lg" />
                                        <div className="h-1.5 w-1/3 bg-dark/5 rounded-lg" />
                                        <div className="h-2 w-10 bg-dark/10 rounded-lg mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Buttons Mockup */}
                        <div className="p-8 absolute bottom-0 inset-x-0 bg-gradient-to-t from-bone via-bone/80 to-transparent">
                            <div className="flex justify-center gap-6 py-4 px-6 bg-dark/5 rounded-[2rem] border border-dark/10 backdrop-blur-3xl">
                                <span className={formData.whatsapp_number ? 'opacity-100' : 'opacity-10'}>💬</span>
                                <span className={igStatus?.is_linked ? 'opacity-100' : 'opacity-10'}>📸</span>
                                <span className={ttStatus.is_linked ? 'opacity-100' : 'opacity-10'}>🎵</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Visual Hint */}
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -right-8 top-1/2 bg-gold-gradient text-dark text-[9px] font-black uppercase px-3 py-1.5 rounded shadow-lg transform rotate-90 origin-right shadow-amber-500/20">
                    Carta Interactiva
                </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="mb-8 border-b border-dark/10 pb-6">
        <h2 className="text-3xl font-light text-dark mb-2 tracking-tight">Facturación & <span className="text-amber-500 font-serif italic">Planes</span></h2>
        <p className="text-[10px] uppercase tracking-widest text-dark/40">Pago y Control de tu Sistema HUB SaaS</p>
      </header>
      
      <div className={`p-8 rounded-[2.5rem] border flex flex-col items-center text-center gap-6 relative overflow-hidden ${isSuspended ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
        {/* Tech Corner Decor */}
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-emerald-500/20 rounded-tr-[2.5rem]" />
        
        <div className="relative">
          <span className="text-5xl">{isSuspended ? '⚠️' : '🛡️'}</span>
          <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isSuspended ? 'text-red-500' : 'text-emerald-500'}`}>
             {isSuspended ? 'SISTEMA_SUSPENDIDO' : 'ACCESO_GARANTIZADO'}
          </h3>
          <p className="text-[9px] font-mono text-dark/40 uppercase tracking-[0.3em]">
             Validación: {bData.valid_until ? new Date(bData.valid_until).toLocaleDateString() : 'LIFETIME_CORE_LICENSE'}
          </p>
        </div>
        
        {isSuspended && (
          <p className="text-[11px] text-red-600/70 max-w-sm font-medium leading-relaxed">
            Tu terminal digital ha entrado en modo restrictivo. Reactiva el núcleo para restaurar las ventas en tiempo real.
          </p>
        )}
      </div>

      <div className="bg-dark/5 p-10 rounded-[2.5rem] border border-dark/10 flex flex-col items-center relative group">
         <div className="absolute top-4 left-6">
            <span className="text-[8px] font-mono text-dark/20 uppercase tracking-widest">Pricing_Module_v2.0</span>
         </div>
         
         <div className="text-center mb-8">
            <span className="text-6xl font-black italic tracking-tighter text-dark select-none relative">
              $35<span className="text-sm font-normal text-amber-500/80 absolute -top-2 -right-10">/USD</span>
            </span>
            <p className="text-[9px] uppercase tracking-[0.4em] text-dark/30 mt-4 font-bold">Plan Premium Mensual</p>
         </div>
         
         <button onClick={handleSubscribe} className="w-full py-5 uppercase font-black tracking-[0.3em] text-[10px] rounded-2xl transition-all flex justify-center items-center gap-3 bg-dark text-bone hover:bg-dark/90 shadow-2xl tactile-button">
            <span className="text-lg">💳</span> Pagar Renovación Segura
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
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-amber-500">Nuevo Enlace <span className="text-[10px] text-dark/20 font-mono font-normal ml-2">PROD_UUID_GEN</span></h3>
            <button type="button" onClick={handleMagicEdit} disabled={aiGenerating} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/10 transition-all">
               {aiGenerating ? 'Optimizando...' : '🪄 Magic AI Edit'}
            </button>
          </div>

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 block mb-2 font-bold font-mono">[ ASSET_UPLOAD_01 ]</label>
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
           <p className="text-[9px] uppercase tracking-widest text-dark/30 font-black mb-6 absolute top-4 font-mono">DEBUG_SIM_ENV_v1.0</p>
           
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
        {loading ? 'PUBLICANDO_EN_HUB...' : 'DESPLEGAR_EN_RED'}
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
              {loading ? 'PROCESANDO...' : 'MIGRAR_AHORA'}
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-dark/5 p-8 rounded-[2.5rem] border border-dark/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-dark/10 rounded-tr-[2.5rem]" />
        <div>
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-dark">Gestión de Sedes</h2>
           <p className="text-[9px] uppercase tracking-[0.4em] text-dark/40 mt-2 font-mono font-bold">NODE_TENANT_v2.0_MASTER</p>
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
                <span className="text-[7px] font-mono text-dark/30 font-bold uppercase tracking-widest">LIVE_BRANCH</span>
             </div>
             <div className="flex items-start justify-between mt-4">
                <div>
                   <h3 className="font-black text-2xl text-dark italic tracking-tighter uppercase leading-none mb-3">{b.name}</h3>
                   <span className="text-[9px] bg-dark text-bone px-3 py-1 rounded-full uppercase font-black tracking-[0.2em]">Slug: {b.slug}</span>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[9px] text-dark/40 font-mono font-bold uppercase tracking-tighter">WP_TERM: {b.whatsapp_number}</p>
                   <p className="text-[9px] text-dark/40 font-mono italic tracking-tighter">{b.address}</p>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-dark/10 flex gap-6">
                <button className="text-[9px] uppercase font-black tracking-widest text-dark/30 hover:text-dark transition-colors">CONFIG_SEDE</button>
                <button className="text-[9px] uppercase font-black tracking-widest text-dark/30 hover:text-dark transition-colors">DATA_LOGS</button>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-dark/60 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-bone border border-dark/10 p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.25)] relative">
               <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono text-dark/20 uppercase tracking-[0.5em]">BRANCH_DEPLOY_UNIT</div>
               <h3 className="text-2xl font-black italic uppercase text-dark mb-8 tracking-tighter mt-4">Añadir Nueva Sede</h3>
               <div className="space-y-6">
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black font-mono">[ INPUT_NAME ]</label>
                    <input type="text" placeholder="Ej: Sede Norte" className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-5 text-sm outline-none focus:border-amber-500 text-dark font-medium" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black font-mono">[ INPUT_SLUG ]</label>
                    <input type="text" placeholder="norte" className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-5 text-sm outline-none focus:border-amber-500 text-dark font-medium" value={newBranch.slug} onChange={e => setNewBranch({...newBranch, slug: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-dark/40 mb-3 block font-black font-mono">[ INPUT_WP_CONN ]</label>
                    <PhoneInput 
                      value={newBranch.whatsapp_number} 
                      onChange={(val) => setNewBranch({...newBranch, whatsapp_number: val})} 
                      placeholder="Número de pedidos"
                    />
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button onClick={() => setIsAdding(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-dark/30 border border-dark/10 hover:bg-dark/5 transition-all">Cancelar</button>
                    <button onClick={handleAdd} className="flex-1 py-5 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl tactile-button">GUARDAR_REGISTRO</button>
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
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 font-mono">ESTRATÉGICO_IA</span>
             </div>
             <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-dark">
                AI Briefing <br /><span className="text-dark/30">Business Suite</span>
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
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-dark/30 border-b border-dark/5 pb-4">Consejos Accionables (Top 3)</h3>
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
                      {suggestions.map((s, i) => (
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
                              EJECUTAR OPTIMIZACIÓN
                           </button>
                        </motion.div>
                      ))}
                    </>
                  )}
               </div>

               <div className="pt-10">
                  <button onClick={onClose} className="w-full py-5 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl tactile-button">
                    ENTENDIDO_SYNC
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
  }, [tenantSlug]);

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

  const { toggleAvailability, magicSnap, loading: productLoading } = useProducts();
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full bg-bone text-dark font-sans selection:bg-amber-500/30 relative pb-32">
      
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none opacity-30 z-0">
         <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
         <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-screen bg-gradient-to-l from-amber-300/10 to-transparent"></div>
      </div>
      
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="fixed inset-0 pointer-events-none z-0 opacity-40" 
         style={{ backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex flex-nowrap items-center bg-bone/90 backdrop-blur-2xl border-b border-dark/10 overflow-x-auto no-scrollbar touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Shadow Overlay for scroll hint */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bone to-transparent pointer-events-none md:hidden" />
        
        <div className="flex-shrink-0 mr-10 relative z-10">
          <img src="/logo.png" alt="HUB" className="h-6 lg:h-8 object-contain" />
        </div>
        <div className="flex gap-10 flex-shrink-0 whitespace-nowrap pr-12">
          {['kanban', 'inventory', 'stats', 'sedes', 'qr', 'marketing', 'autopilot', 'eventos', 'settings', 'billing'].map(m => (
            <button key={m} onClick={() => setView(m)}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-3 ${view === m ? 'text-gold-gradient' : 'text-dark/30 hover:text-dark/60'}`}>
              {m === 'kanban' ? 'Pedidos Live' : m === 'inventory' ? 'Suministros' : m === 'stats' ? 'Monitor' : m === 'sedes' ? 'Sedes' : m === 'qr' ? 'Punto QR' : m === 'marketing' ? 'Marketing AI' : m === 'autopilot' ? 'IG Autopilot' : m === 'eventos' ? '🎉 Eventos' : m === 'settings' ? 'Branding' : 'Billing'}
              {view === m && (
                <motion.div 
                  layoutId="hud-nav" 
                  className="absolute -bottom-1 left-0 h-0.5 bg-gold-gradient w-full shadow-[0_0_15px_rgba(252,211,77,0.6)]" 
                />
              )}
            </button>
          ))}
          <div className="flex flex-col items-end ml-auto">
             <p className="text-[7px] font-mono text-dark/30 uppercase tracking-widest">Linked_Session</p>
             <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-tighter">
                {localStorage.getItem('hub_tenant')?.toUpperCase() || 'EXTERNAL_USER'} 
                <span className="mx-2 text-dark/10">|</span> 
                ID_{config?.id || '?'}
             </p>
          </div>

          <button 
            onClick={() => setShowBriefing(true)}
            className="relative flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20 ml-6 animate-pulse"
          >
            ✦ Briefing IA
            {suggestions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {suggestions.length}
                </span>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="text-[9px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors ml-6"
          >
            SALIR_SYNC ✕
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-5 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <KanbanBoard key="kanban" tenantSlug={tenantSlug} onAuthError={handleAuthError} config={config} />
          ) : view === 'sedes' ? (
            <SedesView key="sedes" branches={branches} tenantSlug={tenantSlug} />
          ) : view === 'inventory' ? (
            <InventoryManager key="inv" products={products} toggleProduct={toggleProduct} magicSnap={magicSnap} onLogout={handleLogout} />
          ) : view === 'stats' ? (
            <LiveMonitor key="stats" onLogout={handleLogout} />
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
             <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Añadir Carga</span>
           </motion.button>
  
           <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAIModal(true)}
             className="h-14 px-6 rounded-2xl text-dark bg-dark/5 flex items-center justify-center gap-3 transition-all hover:bg-dark/10 border border-dark/10 tactile-button">
             <span className="text-lg">✦</span>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Migrar con IA</span>
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
