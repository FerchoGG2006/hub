import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, EmptyState } from '../../../shared/ui';
import { useWebSocketContext } from '../../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const LiveMonitor = () => {
  const { tenantSlug } = useParams();
  const [metrics, setMetrics] = useState({
    sales_today: 0,
    orders_today: 0,
    avg_ticket: 0,
    trending_products: []
  });
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocketContext();

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/v1/analytics/metrics/${tenantSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.warn('Error fetching real metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Reactividad en tiempo real: Si llega una orden pagada o una vista, refrescar
  useEffect(() => {
    if (lastMessage?.type === 'ORDER_PAID' || lastMessage?.type === 'ANALYTICS_UPDATE') {
      fetchMetrics();
    }
  }, [lastMessage, fetchMetrics]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-dark/30">Hidratando Datos Reales...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <Badge variant="brand" className="mb-2">Métricas de Negocio</Badge>
          <Heading level={2}>Rendimiento de <span className="font-[var(--font-serif)] italic">Hoy</span></Heading>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center text-center py-10 !rounded-[2.5rem] shadow-sm bg-white border border-[var(--border-soft)]">
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4 font-bold opacity-60">
            Ventas Netas (Hoy)
          </p>
          <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-none mb-4">
            ${metrics.sales_today.toLocaleString('es-CO')}
          </span>
          {metrics.sales_today === 0 && (
            <p className="text-[10px] text-amber-600/50 font-bold uppercase tracking-widest">Esperando primer pedido...</p>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center text-center py-10 !rounded-[2.5rem] shadow-sm bg-white border border-[var(--border-soft)]">
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4 font-bold opacity-60">
            Ticket Promedio
          </p>
          <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-none mb-4">
            ${metrics.avg_ticket.toLocaleString('es-CO')}
          </span>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{metrics.orders_today} órdenes totales</p>
        </Card>
      </div>

      <section>
        <Heading level={4} className="mb-8 !text-[10px] uppercase tracking-[0.2em] text-[var(--brand-accent)]">
          Productos con mayor interés
        </Heading>
        
        {metrics.trending_products.length === 0 ? (
          <EmptyState 
            icon="📉"
            title="Sin tendencias aún"
            description="Las visualizaciones de tus clientes aparecerán aquí automáticamente."
          />
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {metrics.trending_products.map(item => {
                const maxHits = metrics.trending_products[0]?.hits || 1;
                const fillPercent = Math.max(5, (item.hits / maxHits) * 100);
                
                return (
                  <motion.div layout key={item.id} className="space-y-3">
                    <div className="flex justify-between text-[11px] uppercase font-bold tracking-tight px-1">
                      <span className="text-[var(--text-primary)]">{item.name}</span>
                      <span className="text-[var(--brand-accent)]">{item.hits} vistas</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-[var(--text-primary)] rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </motion.div>
  );
};
