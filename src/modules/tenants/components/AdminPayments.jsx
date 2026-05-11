import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, paid, pending, failed

  const fetchPayments = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/admin/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 10000); // Polling cada 10s para el admin
    return () => clearInterval(interval);
  }, []);

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Pagado' };
      case 'pending': return { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pendiente' };
      case 'failed': return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Fallido' };
      case 'expired': return { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Expirado' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', label: status };
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-dark italic uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
            Historial de Pagos
          </h2>
          <p className="text-dark/40 text-xs uppercase tracking-widest mt-1">Seguimiento automático de transacciones digitales</p>
        </div>

        <div className="flex items-center gap-2 bg-dark/5 p-1 rounded-xl border border-dark/5">
          {['all', 'paid', 'pending', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-dark shadow-sm' : 'text-dark/40 hover:text-dark'
              }`}
            >
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-3xl border border-dark/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
             <p className="text-dark/30 text-[10px] uppercase tracking-widest">Cargando transacciones...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center">
             <p className="text-dark/20 text-sm italic font-medium">No se encontraron pagos en esta categoría.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark/[0.02] border-bottom border-dark/5">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Fecha / Hora</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Cliente / Orden</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Referencia de pago</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Valor</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Estado</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/30 font-bold">Detalle de pasarela</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                <AnimatePresence>
                  {filteredPayments.map((p) => {
                    const style = getStatusStyle(p.status);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-dark/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs text-dark font-bold">{new Date(p.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-dark/30 font-mono mt-1">{new Date(p.created_at).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-dark font-bold">{p.customer_name}</p>
                          <p className="text-[10px] text-amber-600 font-bold mt-1">ORDEN #{p.order_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-[10px] bg-dark/5 px-2 py-1 rounded text-dark/60 font-mono">{p.reference}</code>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-dark font-black">${(p.amount / 1000).toFixed(0)}k</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {p.transaction_id ? (
                            <div className="flex flex-col">
                               <p className="text-[9px] text-dark/40 font-mono truncate max-w-[120px]">{p.transaction_id}</p>
                               <p className="text-[8px] text-emerald-500 font-bold uppercase mt-0.5">{p.payment_method}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-dark/20 italic">Sin ID de pasarela</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Ventas confirmadas</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              ${(payments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) / 1000).toFixed(0)}k
            </p>
         </div>
         <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Pendientes de pago</p>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {payments.filter(p => p.status === 'pending').length}
            </p>
         </div>
         <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-3xl">
            <p className="text-[10px] uppercase tracking-widest text-red-600 font-bold">Transacciones rechazadas</p>
            <p className="text-2xl font-black text-red-700 mt-1">
              {payments.filter(p => p.status === 'failed').length}
            </p>
         </div>
      </div>
    </div>
  );
};
