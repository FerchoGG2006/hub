import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── BIOMETRIC LOGIN TERMINAL ── */
export const LoginTerminal = ({ onAuth }) => {
  return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6 w-full fixed inset-0 z-[200]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-64 h-64 flex items-center justify-center"
      >
        {/* Círculos de escaneo rotatorios */}
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
        
        {/* Icono de Seguridad */}
        <div className="text-center z-10">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-4"
          >
            🛡️
          </motion.div>
          <h2 className="text-[10px] text-amber-500 uppercase tracking-[0.5em] font-black">
            System_Auth
          </h2>
        </div>
      </motion.div>

      <input 
        type="password" 
        placeholder="PASSCODE" 
        className="mt-12 w-48 bg-transparent border-b border-white/20 py-2 text-center text-white tracking-[0.5em] outline-none focus:border-amber-500 transition-all font-mono"
        onChange={(e) => e.target.value === '1234' && onAuth()} // Clave maestra rápida
      />
    </div>
  );
};

/* ── LIVE MONITOR (Analytics with WebSockets) ── */
export const LiveMonitor = ({ onLogout }) => {
  const [stats, setStats] = useState([]);
  const [totalHits, setTotalHits] = useState(0);

  // Fetch inicial
  const fetchTopStats = () => {
    fetch(`${API_URL}/api/analytics/top`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setTotalHits(data.reduce((acc, item) => acc + item.hits, 0));
      })
      .catch(err => console.warn('LiveMonitor init failed:', err));
  };

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
  }, []);

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
            {stats.map((item, idx) => {
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

/* ── COMPONENTS (Colecciones) ── */
const InventoryManager = ({ products, toggleProduct, onLogout }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      
      <header className="mb-12 pt-8 pb-6 border-b border-white/10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-white/40 uppercase font-light mb-3 flex items-center gap-3">
              <span className="w-5 h-px bg-amber-500/50"></span> DASHBOARD_01
            </p>
            <img src="/logo.png" alt="HUB" className="h-14 lg:h-16 object-contain invert mix-blend-screen opacity-90 -ml-1" />
          </div>
          
          {/* Metadata Block */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 text-[9px] font-mono tracking-[0.15em] uppercase bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-white/40">ADMIN: <span className="text-white font-medium ml-2">FERNANDO_BAQUERO</span></p>
            <p className="text-white/40">STATUS: <span className="text-amber-500 font-bold ml-2">LINKED_SECURE</span></p>
            <p className="text-white/40">LOCATION: <span className="text-white/80 ml-2">NODE_01_VPAR</span></p>
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
            <h3 className={`text-xs font-bold uppercase tracking-wide truncate transition-colors ${!item.is_available ? 'text-white/40 line-through' : 'text-white'}`}>
              {item.name}
            </h3>
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

/* ── MODALS ── */
const AddProductModal = ({ onClose, onProductAdded }) => {
  const [formData, setFormData] = useState({ name: '', price: '', desc: '', emoji: '🍽️', category: '' });
  const [file, setFile] = useState(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(r => r.json())
      .then(data => { setCats(data); if (data.length) setFormData(f => ({ ...f, category: String(data[0].id) })); })
      .catch(() => setCats([{ id: 1, name: 'Entradas' }, { id: 2, name: 'Fuertes' }, { id: 3, name: 'Licores' }]));
  }, []);

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
      const res = await fetch(`${API_URL}/api/admin/products`, { method: 'POST', body: data });
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
      className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] p-6 relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
        
        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 text-amber-500">Nuevo Enlace de Datos</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Transmisión Visual (Foto)</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
              className="w-full text-xs file:bg-amber-500/20 file:text-amber-500 file:border-none file:px-4 file:py-2 file:rounded-full file:font-bold file:cursor-pointer" />
          </div>

          <div className="flex gap-3">
            <input value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })}
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

          <textarea placeholder="Parámetros de descripción..." value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })}
            className="w-full bg-transparent border border-white/10 p-4 rounded-2xl text-xs h-24 outline-none focus:border-amber-500 transition-colors resize-none placeholder-white/20" />

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-black transition-all"
            style={{ background: loading ? '#b45309' : '#f59e0b', boxShadow: '0 4px 15px rgba(245,158,11,0.2)' }}>
            {loading ? 'Sincronizando...' : 'Inyectar al Sistema'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};


/* ── MASTER TERMINAL ── */
export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('inventory'); // inventory, stats
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu-dynamic`);
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
  };

  useEffect(() => { 
    if (isAuthenticated) fetchProducts(); 
  }, [isAuthenticated]);

  const toggleProduct = async (id, currentStatus) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error("Toggle failed");
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    } catch(e) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: currentStatus } : p));
    }
  };

  if (!isAuthenticated) {
    return <AnimatePresence mode="wait"><LoginTerminal onAuth={() => setIsAuthenticated(true)} /></AnimatePresence>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 h-[100dvh] w-full bg-[#050505] text-white font-sans selection:bg-amber-500/30 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ paddingBottom: '100px' }}>
      
      {/* Barra de Navegación Editorial */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center">
          {/* El filtro invert convierte el negro en blanco (y el blanco en negro). 
              El mix-blend-screen hace que el negro (fondo) se vuelva completamente transparente. */}
          <img src="/logo.png" alt="HUB" className="h-5 object-contain invert mix-blend-screen opacity-90" />
        </div>
        <div className="flex gap-4">
          {['inventory', 'stats'].map(m => (
            <button key={m} onClick={() => setView(m)}
              className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative ${view === m ? 'text-amber-500' : 'text-white/30 hover:text-white/80'}`}>
              {m === 'inventory' ? 'Suministros' : 'Live Monitor'}
              {view === m && <motion.div layoutId="hud-nav" className="absolute -bottom-1 left-0 h-px bg-amber-500 w-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-5 max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'inventory' ? (
            <InventoryManager key="inv" products={products} toggleProduct={toggleProduct} onLogout={() => setIsAuthenticated(false)} />
          ) : (
            <LiveMonitor key="stats" onLogout={() => setIsAuthenticated(false)} />
          )}
        </AnimatePresence>
      </main>

      {/* Dock Inferior */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center p-1.5 rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl z-40">
         <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddModal(true)}
           className="h-12 px-6 rounded-2xl text-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
           style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
           <span className="text-xl font-black leading-none">+</span>
           <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Añadir Carga</span>
         </motion.button>
      </div>

      <AnimatePresence>
        {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onProductAdded={fetchProducts} />}
      </AnimatePresence>
    </motion.div>
  );
};
