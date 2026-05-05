import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OrderCard = ({ o, nextStatus, color, changeStatus, printOrder }) => {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const startTime = new Date(o.created_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [o.created_at]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = elapsed > 600; // 10 mins
  const isCritical = elapsed > 1200; // 20 mins

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ 
        opacity: 1, 
        scale: 1,
        borderColor: isCritical ? 'rgba(239, 68, 68, 0.5)' : isUrgent ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)'
      }} 
      exit={{ opacity: 0 }} 
      key={o.id}
      className={`bg-black/40 border-2 rounded-2xl p-5 hover:border-amber-500/30 transition-colors relative overflow-hidden group ${o.is_priority ? 'ring-2 ring-amber-500/50' : ''}`}
    >
      {o.is_priority && (
        <div className="absolute top-0 left-0 bg-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded-br-lg uppercase tracking-widest z-10">
          PRIORITY_VIP
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2 relative z-0">
        <span className="text-white font-bold">{o.customer_name || 'Mesa Local'}</span>
        <div className="flex flex-col items-end">
          <span className="text-amber-500 font-bold">${o.total_price.toLocaleString()}</span>
          <span className={`text-[10px] font-mono font-bold mt-1 ${isCritical ? 'text-red-500 animate-pulse' : isUrgent ? 'text-amber-500' : 'text-white/40'}`}>
            ⏱️ {formatTime(elapsed)}
          </span>
        </div>
      </div>
      
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
        <span>ORDEN #{o.id} • {o.table_number || 'S/M'}</span>
        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{o.branch_name || 'Central'}</span>
      </p>
      
      <div className="flex gap-2 w-full mt-2">
         {nextStatus && (
           <button onClick={() => changeStatus(o.id, nextStatus)}
             className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-white/10"
             style={{ background: 'rgba(255,255,255,0.05)', color: color }}>
             ➔ Mover a {nextStatus}
           </button>
         )}
         <button onClick={() => printOrder(o)} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 text-[10px] transition-colors" title="Imprimir Comanda">
            🖨️
         </button>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ title, items, nextStatus, color, icon, changeStatus, printOrder }) => (
  <div className="flex-1 min-w-[300px] sm:min-w-[350px] flex-shrink-0 snap-center bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-gradient-to-bl blur-[40px] pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom left, ${color}, transparent)` }} />
    <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
      <span style={{ color }}>{icon}</span> {title} <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[9px]">{items.length}</span>
    </h3>
    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-10">
      <AnimatePresence>
        {items.map(o => (
          <OrderCard key={o.id} o={o} nextStatus={nextStatus} color={color} changeStatus={changeStatus} printOrder={printOrder} />
        ))}
      </AnimatePresence>
    </div>
  </div>
);

export const KanbanBoard = ({ tenantSlug }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ avgPrep: '0:00', totalServed: 0 });

  const playAlert = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.warn("Audio Context blocked by browser");
    }
  };

  const calculateStats = (allOrders) => {
    const served = allOrders.filter(o => o.status === 'served');
    if (served.length === 0) return;
    
    const totalDuration = served.reduce((acc, o) => {
        const start = new Date(o.created_at).getTime();
        const end = o.updated_at ? new Date(o.updated_at).getTime() : Date.now();
        return acc + (end - start);
    }, 0);
    
    const avgMs = totalDuration / served.length;
    const avgSecs = Math.floor(avgMs / 1000);
    const mins = Math.floor(avgSecs / 60);
    const secs = avgSecs % 60;
    setStats({ 
        avgPrep: `${mins}:${secs.toString().padStart(2, '0')}`,
        totalServed: served.length 
    });
  };

  const changeStatus = async (id, status) => {
    const token = localStorage.getItem('hub_token');
    await fetch(`${API_URL}/api/admin/orders/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o);
        calculateStats(updated);
        return updated;
    });
  };

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        calculateStats(data);
      }
    };

    loadOrders();
    let ws;
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/menu';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_ORDER') {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            playAlert();
            setOrders(prev => [payload.order, ...prev]);
        } else if (payload.type === 'ORDER_UPDATED') {
            setOrders(prev => prev.map(o => o.id === payload.order_id ? { ...o, status: payload.status } : o));
        }
      };
    } catch (err) {
      console.error(err);
    }
    return () => { if (ws) ws.close(); };
  }, [tenantSlug]);

  const printOrder = (order) => {
    let itemsStr = "";
    if(order.items && order.items.length) {
      itemsStr = order.items.map(i => `${i.quantity}x ${i.product_name}`).join('\n');
    }
    const ticket = `====== TECH GASTRO HUB ======
ORDEN #${order.id}
Cliente: ${order.customer_name || 'Local'}
Mesa: ${order.table_number || 'S/M'}
-----------------------------
${itemsStr || 'Productos no detallados'}
=============================
Total: $${order.total_price ? order.total_price.toLocaleString() : '0'}
=============================`;
    console.log("Imprimiendo ticket:\n", ticket);
    alert(`🖨️ Simulando impresión térmica para Orden #${order.id}`);
  };

  const pending = orders.filter(o => o.status === 'pending');
  const cooking = orders.filter(o => o.status === 'cooking');
  const served = orders.filter(o => o.status === 'served');

  return (
    <div className="h-full flex flex-col pt-4 max-w-6xl mx-auto z-10 relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-light">Live <span className="font-serif italic text-amber-500">Kitchen</span></h2>
            <p className="text-sm text-white/40">Órdenes recibidas vía 4D Socket.</p>
        </div>
        <div className="flex gap-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">AVG_PREP_TIME</p>
                <p className="text-xl font-black text-amber-500 font-mono">{stats.avgPrep}</p>
            </div>
            <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">TOTAL_SERVED</p>
                <p className="text-xl font-black text-emerald-500 font-mono">{stats.totalServed}</p>
            </div>
        </div>
      </div>
      <div className="flex flex-nowrap w-full gap-6 overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', minHeight: '65vh' }}>
        <KanbanColumn title="Ingreso" items={pending} nextStatus="cooking" color="#f59e0b" icon="🔥" changeStatus={changeStatus} printOrder={printOrder} />
        <KanbanColumn title="Cocina" items={cooking} nextStatus="served" color="#3b82f6" icon="🍳" changeStatus={changeStatus} printOrder={printOrder} />
        <KanbanColumn title="Despacho" items={served} nextStatus={null} color="#10b981" icon="✅" changeStatus={changeStatus} printOrder={printOrder} />
      </div>
    </div>
  );
};
