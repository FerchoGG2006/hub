import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const KanbanBoard = ({ tenantSlug }) => {
  const [orders, setOrders] = useState([]);
  
  const loadOrders = async () => {
    const token = localStorage.getItem('hub_token');
    const res = await fetch(`${API_URL}/api/admin/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  };

  useEffect(() => {
    loadOrders();
    // Escuchar websockets para nuevas órdenes o cambios de estado
    let ws;
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/menu';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_ORDER') {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Alerta!
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

  const changeStatus = async (id, status) => {
    const token = localStorage.getItem('hub_token');
    await fetch(`${API_URL}/api/admin/orders/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const pending = orders.filter(o => o.status === 'pending');
  const cooking = orders.filter(o => o.status === 'cooking');
  const served = orders.filter(o => o.status === 'served');

  const Column = ({ title, items, nextStatus, color, icon }) => (
    <div className="flex-1 min-w-[300px] sm:min-w-[350px] flex-shrink-0 snap-center bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-gradient-to-bl blur-[40px] pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom left, ${color}, transparent)` }} />
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <span style={{ color }}>{icon}</span> {title} <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[9px]">{items.length}</span>
      </h3>
      <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-10">
        <AnimatePresence>
          {items.map(o => (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} key={o.id}
             className="bg-black/40 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-bold">{o.customer_name || 'Mesa Local'}</span>
                <span className="text-amber-500 font-bold">${o.total_price.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">ORDEN #{o.id} • {o.table_number || 'S/M'}</p>
              
              {nextStatus && (
                <button onClick={() => changeStatus(o.id, nextStatus)}
                  className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', ':hover': { background: color, color: '#000' }}}>
                  ➔ Mover a {nextStatus}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col pt-4 max-w-6xl mx-auto z-10 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-light">Live <span className="font-serif italic text-amber-500">Kitchen</span></h2>
        <p className="text-sm text-white/40">Órdenes recibidas vía 4D Socket.</p>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch', minHeight: '65vh' }}>
        <Column title="Ingreso" items={pending} nextStatus="cooking" color="#f59e0b" icon="🔥" />
        <Column title="Cocina" items={cooking} nextStatus="served" color="#3b82f6" icon="🍳" />
        <Column title="Despacho" items={served} nextStatus={null} color="#10b981" icon="✅" />
      </div>
    </div>
  );
};
