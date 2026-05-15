import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, EmptyState } from '../../../shared/ui';
import { useWebSocketContext } from '../../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatCOP = (value) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString('es-CO')}`;
};

export const LiveMonitor = () => {
  const { tenantSlug } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useWebSocketContext();

  const fetchMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      if (!token) {
        setError('Sin sesión activa');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/v1/analytics/metrics/${tenantSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${res.status}`);
      }
      const json = await res.json();
      setMetrics(json.data || json);
      setError(null);
    } catch (err) {
      console.warn('Error fetching metrics:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchMetrics();
    // Refrescar métricas cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Reactividad en tiempo real
  useEffect(() => {
    if (lastMessage?.type === 'ORDER_PAID' || lastMessage?.type === 'ORDER_CREATED' || lastMessage?.type === 'ANALYTICS_UPDATE') {
      fetchMetrics();
    }
  }, [lastMessage, fetchMetrics]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)] rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-disabled)]">Cargando métricas reales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm font-bold text-[var(--text-primary)]">No se pudieron cargar las métricas</p>
        <p className="text-xs text-[var(--text-muted)]">{error}</p>
        <button onClick={fetchMetrics} className="mt-4 px-6 py-2 bg-[var(--brand-primary)] text-white rounded-xl text-[10px] uppercase tracking-widest font-bold">
          Reintentar
        </button>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Ventas Hoy', 
      value: formatCOP(metrics?.sales_today || 0), 
      sub: metrics?.sales_today === 0 ? 'Esperando primer pedido...' : `${metrics?.currency || 'COP'}`,
      color: 'var(--brand-primary)'
    },
    { 
      label: 'Pedidos', 
      value: String(metrics?.orders_today || 0), 
      sub: metrics?.orders_today === 0 ? 'Sin órdenes aún' : 'órdenes hoy',
      color: 'var(--brand-accent)'
    },
    { 
      label: 'Ticket Prom.', 
      value: formatCOP(metrics?.avg_ticket || 0), 
      sub: metrics?.avg_ticket === 0 ? 'Sin datos' : 'por orden',
      color: 'var(--text-primary)'
    },
    { 
      label: 'Prep. Media', 
      value: metrics?.avg_prep_min ? `${metrics.avg_prep_min} min` : '-- min', 
      sub: metrics?.avg_prep_min ? 'tiempo promedio' : 'Sin preparaciones',
      color: 'var(--status-success)'
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <Badge variant="brand" className="mb-2">Métricas de Negocio</Badge>
          <Heading level={2}>Rendimiento de <span className="font-[var(--font-serif)] italic">Hoy</span></Heading>
        </div>
        <button onClick={fetchMetrics} className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors font-bold">
          ↻ Actualizar
        </button>
      </header>

      {/* ── KPI CARDS (DATOS REALES) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="flex flex-col justify-between !p-6 !rounded-[2rem] shadow-sm">
            <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--text-disabled)] mb-3 font-black">{kpi.label}</p>
            <span className="text-2xl md:text-xl font-black tracking-tighter leading-none mb-2" style={{ color: kpi.color }}>
              {kpi.value}
            </span>
            <span className="text-[8px] font-bold opacity-40 uppercase tracking-wider">{kpi.sub}</span>
          </Card>
        ))}
      </div>

      {/* ── PRODUCTOS CON MAYOR INTERÉS ── */}
      <section>
        <Heading level={4} className="mb-8 !text-[10px] uppercase tracking-[0.2em] text-[var(--brand-accent)]">
          Productos con mayor interés
        </Heading>
        
        {(!metrics?.trending_products || metrics.trending_products.length === 0) ? (
          <EmptyState 
            icon="📉"
            title="Sin tendencias aún"
            description="Las interacciones de tus clientes con tu menú aparecerán aquí automáticamente."
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
                      <span className="text-[var(--brand-accent)]">{item.hits} interacciones</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
