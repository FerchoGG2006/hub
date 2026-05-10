import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OrderCard = ({ o, nextStatus, color, changeStatus, printOrder }) => {
  const [elapsed, setElapsed] = React.useState(0);
  const items = React.useMemo(() => {
    try {
      return typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || []);
    } catch {
      return [];
    }
  }, [o.items_json]);

  React.useEffect(() => {
    if (!o.created_at) return;
    const startTime = new Date(o.created_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [o.created_at]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = elapsed > 600; // 10 mins
  const isCritical = elapsed > 1200; // 20 mins

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ 
        opacity: 1, 
        y: 0,
        borderColor: isCritical ? '#ef4444' : isUrgent ? '#C8891A' : 'rgba(22, 17, 15, 0.08)'
      }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      key={o.id}
      className="bg-[#FCFAF7] border border-[rgba(22,17,15,0.06)] rounded-[2rem] p-6 shadow-[0_12px_40px_rgba(22,17,15,0.03)] hover:shadow-[0_20px_60px_rgba(22,17,15,0.08)] transition-all relative overflow-hidden group"
    >
      {o.is_priority && (
        <div className="absolute top-0 left-0 bg-gold text-white text-[8px] font-black px-4 py-1.5 rounded-br-2xl uppercase tracking-[0.2em] z-10">
          PRIORIDAD
        </div>
      )}
      
      <div className="flex justify-between items-start mb-5">
        <div className="flex flex-col">
          <span className="heading-editorial text-sm uppercase font-bold tracking-tight truncate max-w-[150px]">{o.customer_name || 'Mesa Local'}</span>
          <span className="text-[8px] text-ink/30 font-black tracking-[0.3em] uppercase">ID_TX_{o.id}</span>
        </div>
        <div className="text-right">
          <p className="serif-italic text-lg leading-none mb-1 font-medium">${(o.total_price || 0).toLocaleString()}</p>
          <p className={`text-[9px] font-black tracking-[0.2em] uppercase ${isCritical ? 'text-red-500 animate-pulse' : isUrgent ? 'text-gold' : 'text-ink/30'}`}>
            {formatTime(elapsed)}
          </p>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-2 mb-6 border-y border-[rgba(22,17,15,0.05)] py-5">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex-shrink-0 text-[9px] font-black text-ink/20">{item.qty}X</span>
              <span className="text-[11px] font-bold text-ink/70 truncate uppercase tracking-tight">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 w-full">
         {nextStatus && (
           <button onClick={() => changeStatus(o.id, nextStatus)}
             className="flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:brightness-110 active:scale-95 shadow-[0_10px_25px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] text-white"
             style={{ backgroundColor: color }}>
             ➔ {nextStatus === 'preparing' ? 'Cocinar' : nextStatus === 'ready' ? 'Listo' : 'Entregar'}
           </button>
         )}
         <button onClick={() => printOrder(o)} className="w-14 h-14 flex items-center justify-center bg-ink/5 hover:bg-ink/10 border border-ink/5 rounded-2xl text-ink/30 text-lg transition-all tactile-button" title="Imprimir Comanda">
            🖨️
         </button>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ title, items, nextStatus, color, icon, changeStatus, printOrder }) => (
  <div className="flex-1 min-w-[320px] flex-shrink-0 snap-center bg-cream-deep/20 border border-border rounded-[2rem] p-6 flex flex-col relative">
    <div className="mb-6 flex justify-between items-end px-2">
      <div className="flex flex-col">
        <span className="tag-editorial mb-0">{title}</span>
        <span className="text-[10px] font-bold text-ink-30 tracking-widest uppercase">{items.length} pedidos</span>
      </div>
      <span className="text-xl opacity-30">{icon}</span>
    </div>
    <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-10">
      <AnimatePresence>
        {items.length > 0 ? (
          items.map(o => (
            <OrderCard key={o.id} o={o} nextStatus={nextStatus} color={color} changeStatus={changeStatus} printOrder={printOrder} />
          ))
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
             <span className="text-3xl opacity-10">{icon}</span>
             <p className="text-[10px] text-ink-30 uppercase tracking-[0.2em] font-bold">Sin pedidos</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export const KanbanBoard = ({ tenantSlug, onAuthError, config }) => {
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
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/orders/${id}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        onAuthError(new Error('401 Unauthorized'));
        return;
      }
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error actualizando estado");
      }

      setOrders(prev => {
          const updated = prev.map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o);
          calculateStats(updated);
          return updated;
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('hub_token');
        const res = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          onAuthError(new Error('401 Unauthorized'));
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
          calculateStats(data);
        }
      } catch (err) {
        console.error("Load orders error:", err);
      }
    };

    loadOrders();
    let ws;
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/menu';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        if (payload.tenant_id && config?.id && payload.tenant_id !== config.id) {
            return;
        }

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
  }, [tenantSlug, config?.id, onAuthError]);

  const printOrder = (order) => {
    const items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []);
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const itemsHtml = items.map(i => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-family: monospace; font-size: 12px;">
        <span>${i.qty}x ${i.name}</span>
        <span>${i.price}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px; font-size: 10px; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; text-align: right; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2 style="margin: 0; font-size: 18px;">${config?.name?.toUpperCase() || 'PLATÓRIN'}</h2>
            <p style="margin: 5px 0; font-size: 10px;">Orden de Cocina</p>
          </div>
          <p style="font-size: 12px;"><b>ORDEN:</b> #${order.id}</p>
          <p style="font-size: 12px;"><b>CLIENTE:</b> ${order.customer_name || 'Local'}</p>
          <p style="font-size: 12px;"><b>MESA/ENTREGA:</b> ${order.table_number || 'S/M'}</p>
          <div style="margin: 15px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            ${itemsHtml}
          </div>
          <div class="total">TOTAL: $${order.total_price?.toLocaleString()}</div>
          <div class="footer">
            <p>Gestionado con Platorin OS</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const pending   = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => o.status === 'preparing');
  const ready     = orders.filter(o => o.status === 'ready');

  return (
    <div className="h-full flex flex-col pt-0 max-w-7xl mx-auto z-10 relative">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[rgba(22,17,15,0.06)] pb-10">
        <div>
          <p className="text-[9px] text-ink/40 uppercase tracking-[0.4em] font-black mb-2">Monitor de Operaciones</p>
          <h2 className="heading-editorial text-4xl">Pedidos en <span className="serif-italic">Tiempo Real</span></h2>
          <p className="text-ink/40 text-sm mt-1">Sincronización instantánea con el flujo de tu cocina.</p>
        </div>
        <div className="flex gap-6 bg-[#FCFAF7] border border-[rgba(22,17,15,0.06)] p-5 rounded-3xl shadow-sm">
            <div className="text-center px-4 border-r border-border">
                <p className="text-[9px] uppercase tracking-widest text-ink/30 mb-1 font-bold">Tiempo Promedio</p>
                <p className="text-xl font-black text-gold font-mono tracking-tighter">{stats.avgPrep}</p>
            </div>
            <div className="text-center px-4">
                <p className="text-[9px] uppercase tracking-widest text-ink/30 mb-1 font-bold">Servidos Hoy</p>
                <p className="text-xl font-black text-[#7E9B84] font-mono tracking-tighter">{stats.totalServed}</p>
            </div>
        </div>
      </header>

      {orders.length === 0 ? (
         <div className="bg-[#FCFAF7] border border-[rgba(22,17,15,0.06)] rounded-[3rem] text-center py-32 space-y-8 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 opacity-[0.02] select-none pointer-events-none">
                <span className="text-[20rem] font-serif italic -rotate-12 block">Platorin</span>
            </div>
            <div className="relative z-10">
               <div className="w-24 h-24 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">🛎️</div>
               <h3 className="heading-editorial text-4xl italic">Tu cocina está lista.</h3>
               <p className="text-ink/40 max-w-sm mx-auto text-sm font-medium">
                 Cuando llegue el primer pedido,<br /> lo verás aparecer aquí en tiempo real.
               </p>
            </div>
         </div>
      ) : (
        <div className="flex flex-nowrap w-full gap-6 overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', minHeight: '65vh' }}>
          <KanbanColumn title="Nuevos" items={pending} nextStatus="preparing" color="#C8891A" icon="🔔" changeStatus={changeStatus} printOrder={printOrder} />
          <KanbanColumn title="Preparando" items={preparing} nextStatus="ready" color="#16110F" icon="🍳" changeStatus={changeStatus} printOrder={printOrder} />
          <KanbanColumn title="Listos" items={ready} nextStatus="paid" color="#7E9B84" icon="🚀" changeStatus={changeStatus} printOrder={printOrder} />
        </div>
      )}
    </div>
  );
};
