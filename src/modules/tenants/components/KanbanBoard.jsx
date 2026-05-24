import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, Button, EmptyState } from '../../../shared/ui';
import { useWebSocket } from '../../../shared/hooks/useWebSocket';
import { ORDER_STATUS } from '../../../shared/constants/orders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OrderCard = ({ o, nextStatus, color, changeStatus, printOrder }) => {
  const [elapsed, setElapsed] = useState(0);
  const items = useMemo(() => {
    try {
      return typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || []);
    } catch {
      return [];
    }
  }, [o.items_json]);

  useEffect(() => {
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
        borderColor: isCritical ? 'var(--status-error)' : isUrgent ? 'var(--status-pending)' : 'var(--border-soft)'
      }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      key={o.id}
      className="bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-[2rem] p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all relative overflow-hidden group"
    >
      {o.is_priority && (
        <div className="absolute top-0 left-0 bg-[var(--brand-accent)] text-white text-[8px] font-black px-4 py-1.5 rounded-br-2xl uppercase tracking-[0.2em] z-10">
          PRIORIDAD
        </div>
      )}
      
      <div className="flex justify-between items-start mb-5">
        <div className="flex flex-col">
          <Heading level={4} className="!text-sm uppercase font-bold tracking-tight truncate max-w-[150px]">
            {o.customer_name || 'Mesa Local'}
          </Heading>
          <span className="text-[8px] text-[var(--text-disabled)] font-black tracking-[0.3em] uppercase">
            {o.table_number ? `Mesa ${o.table_number}` : `Pedido #${o.id}`}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-[9px] font-black tracking-[0.2em] uppercase ${isCritical ? 'text-[var(--status-error)] animate-pulse' : isUrgent ? 'text-[var(--status-pending)]' : 'text-[var(--text-disabled)]'}`}>
            {formatTime(elapsed)}
          </p>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-2 mb-6 border-y border-[var(--border-soft)] py-5">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex-shrink-0 text-[9px] font-black text-[var(--text-disabled)]">{item.qty}X</span>
              <span className="text-[11px] font-bold text-[var(--text-muted)] truncate uppercase tracking-tight">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 w-full">
         {nextStatus && (
           <Button 
            onClick={() => changeStatus(o.id, nextStatus)}
            className="flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] !rounded-2xl"
            style={{ backgroundColor: color }}
           >
             ➔ {nextStatus === ORDER_STATUS.PREPARING ? 'Cocinar' : nextStatus === ORDER_STATUS.READY ? 'Listo' : 'Entregar'}
           </Button>
         )}
         <button 
           onClick={() => printOrder(o)} 
           className="w-14 h-14 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-soft)] rounded-2xl text-[var(--text-disabled)] text-lg transition-all active:scale-95" 
           title="Imprimir Comanda"
         >
            🖨️
         </button>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ title, items, nextStatus, color, icon, changeStatus, printOrder }) => (
  <div className="flex-1 min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-center bg-[var(--bg-secondary)]/50 border border-[var(--border-soft)] rounded-[2rem] p-6 flex flex-col relative">
    <div className="mb-6 flex justify-between items-end px-2">
      <div className="flex flex-col">
        <Badge variant="brand" className="mb-0">{title}</Badge>
        <span className="text-[10px] font-bold text-[var(--text-disabled)] tracking-widest uppercase">{items.length} pedidos</span>
      </div>
      <span className="text-xl opacity-30">{icon}</span>
    </div>
    <div className="space-y-4 overflow-y-auto flex-1 pb-10">
      <AnimatePresence>
        {items.length > 0 ? (
          items.map(o => (
            <OrderCard key={o.id} o={o} nextStatus={nextStatus} color={color} changeStatus={changeStatus} printOrder={printOrder} />
          ))
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
             <span className="text-3xl opacity-10">{icon}</span>
             <p className="text-[10px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold">Sin pedidos</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export const KanbanBoard = ({ tenantId, lastMessage }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ avgPrep: '0:00', totalServed: 0 });

  const playAlert = useCallback(() => {
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
  }, []);

  const calculateStats = useCallback((allOrders) => {
    const served = allOrders.filter(o => o.status === 'completed' || o.status === 'served');
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
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const ordersData = json.data || json;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        calculateStats(Array.isArray(ordersData) ? ordersData : []);
      }
    } catch (err) {
      console.error("Load orders error:", err);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'NEW_ORDER') {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playAlert();
        setOrders(prev => [lastMessage.order, ...prev]);
    } else if (lastMessage.type === 'ORDER_UPDATED') {
        setOrders(prev => {
            const updated = prev.map(o => o.id === lastMessage.order_id ? { ...o, status: lastMessage.status, updated_at: new Date().toISOString() } : o);
            calculateStats(updated);
            return updated;
        });
    }
  }, [lastMessage, playAlert, calculateStats]);

  const changeStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/orders/${id}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.detail || "Error actualizando estado");
      }

      setOrders(prev => {
          const updated = prev.map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o);
          calculateStats(updated);
          return updated;
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

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
            <h2 style="margin: 0; font-size: 18px;">PLATÓRIN OS</h2>
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

  const pending   = orders.filter(o => o.status === ORDER_STATUS.PENDING);
  const preparing = orders.filter(o => o.status === ORDER_STATUS.PREPARING);
  const ready     = orders.filter(o => o.status === ORDER_STATUS.READY);

  return (
    <div className="h-full flex flex-col pt-0 max-w-7xl mx-auto z-10 relative">
      {orders.length === 0 ? (
         <EmptyState 
           icon="🛎️"
           title="Tu cocina está lista."
           description="Cuando llegue el primer pedido, lo verás aparecer aquí en tiempo real."
           className="py-32"
         />
      ) : (
        <div className="flex flex-nowrap w-full gap-6 overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', minHeight: '65vh' }}>
          <KanbanColumn title="Nuevos" items={pending} nextStatus={ORDER_STATUS.PREPARING} color="var(--brand-accent)" icon="🔔" changeStatus={changeStatus} printOrder={printOrder} />
          <KanbanColumn title="Preparando" items={preparing} nextStatus={ORDER_STATUS.READY} color="var(--text-primary)" icon="🍳" changeStatus={changeStatus} printOrder={printOrder} />
          <KanbanColumn title="Listos" items={ready} nextStatus={ORDER_STATUS.COMPLETED} color="var(--brand-primary)" icon="🚀" changeStatus={changeStatus} printOrder={printOrder} />
        </div>
      )}
    </div>
  );
};
