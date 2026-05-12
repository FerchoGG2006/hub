/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, EmptyState } from '../../../shared/ui';
import { useWebSocketContext } from '../../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const LiveMonitor = ({ tenantId }) => {
  const { tenantSlug } = useParams();
  const [stats, setStats] = useState([]);
  const [totalHits, setTotalHits] = useState(0);
  const { lastMessage } = useWebSocketContext();

  const fetchTopStats = useCallback(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/analytics/top`)
      .then(res => res.json())
      .then(json => {
        const data = json.data || json;
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
  }, [fetchTopStats]);

  useEffect(() => {
    if (lastMessage?.type === 'ANALYTICS_UPDATE' && lastMessage?.action === 'add_to_cart') {
      if (navigator.vibrate) navigator.vibrate(10);
      
      const productId = lastMessage.product_id;
      setStats(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(p => p.id === productId);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], hits: copy[idx].hits + 1 };
          copy.sort((a, b) => b.hits - a.hits);
          return copy;
        }
        return prev;
      });

      // If product not in local stats list, refresh everything
      if (!stats.some(p => p.id === productId)) {
        fetchTopStats();
      }

      setTotalHits(prev => prev + 1);
    }
  }, [lastMessage, fetchTopStats, stats]);

  const totalFormat = (totalHits * 32000).toLocaleString('es-CO'); 
  const topProduct = stats.length > 0 ? stats[0] : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <Badge variant="brand" className="mb-2">Métricas en vivo</Badge>
          <Heading level={2}>Ventas de <span className="font-[var(--font-serif)] italic">Hoy</span></Heading>
        </div>
      </header>

      <Card className="flex flex-col items-center justify-center text-center py-12 !rounded-[2.5rem] shadow-soft bg-white border border-[var(--border-soft)]">
        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4 font-bold opacity-60">
          Total Recibido Hoy (Est.)
        </p>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black italic text-[var(--text-primary)] tracking-tighter leading-none mb-6">
            ${totalFormat}
          </span>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-soft)] text-[var(--brand-primary)] rounded-full">
            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">+2.4% hoy</span>
          </div>
        </div>
      </Card>

      <section>
        <Heading level={4} className="mb-8 !text-[10px] uppercase tracking-[0.2em] text-[var(--brand-accent)]">
          Lo más buscado por tus clientes
        </Heading>
        
        {stats.length === 0 ? (
          <EmptyState 
            icon="📉"
            title="Sin actividad detectada"
            description="Verás qué platos interesan más a tus clientes en tiempo real."
          />
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {stats.map(item => {
                const maxHits = topProduct ? topProduct.hits : 1;
                const fillPercent = Math.max(5, (item.hits / maxHits) * 100);
                
                return (
                  <motion.div layout key={item.id} className="space-y-3">
                    <div className="flex justify-between text-[11px] uppercase font-bold tracking-tight px-1">
                      <span className="text-[var(--text-primary)]">{item.name}</span>
                      <span className="text-[var(--brand-accent)]">{item.hits} vistas</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <motion.div 
                        key={`bar-${item.id}-${item.hits}`}
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
