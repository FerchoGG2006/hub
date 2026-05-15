import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Button, Badge } from '../../../shared/ui';
import { PaymentGatewayModal } from '../../tenants/components/PaymentGatewayModal';

export const BillingManager = ({ config }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isSuspended = config?.subscription_status === 'suspended';
  const validUntil = config?.valid_until;

  const handleSubscribe = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/admin/billing/subscribe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` }
      });
      if(!res.ok) throw new Error("Synchronization Error");
      window.location.reload();
    } catch (err) {
      console.warn("Sync Error", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 max-w-4xl mx-auto px-4 md:px-0"
    >
      <header className="mb-8 md:mb-12 border-b border-[var(--border-soft)] pb-6 md:pb-8">
        <Badge variant="brand" className="mb-2">Suscripción & Licencias</Badge>
        <Heading level={2} className="text-2xl md:text-4xl">
          Facturación & <span className="font-[var(--font-serif)] italic">Planes</span>
        </Heading>
      </header>
      
      {/* ── ESTADO ACTUAL ── */}
      <Card className={`p-6 md:p-10 !rounded-[2rem] md:!rounded-[3rem] border flex flex-col items-center text-center gap-4 md:gap-6 relative overflow-hidden ${isSuspended ? 'bg-[var(--status-error)]/5 border-[var(--status-error)]/20' : 'bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/20'}`}>
        <div className="relative">
          <span className="text-4xl md:text-5xl">{isSuspended ? '⚠️' : '🛡️'}</span>
        </div>

        <div className="space-y-1 md:space-y-2">
          <Heading level={3} className={`italic uppercase tracking-tighter text-lg md:text-2xl ${isSuspended ? 'text-[var(--status-error)]' : 'text-[var(--brand-primary)]'}`}>
             {isSuspended ? 'Núcleo Restringido' : 'Suscripción Activa'}
          </Heading>
          <p className="text-[8px] md:text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black">
             Vencimiento: {validUntil ? new Date(validUntil).toLocaleDateString() : 'Acceso Vitalicio'}
          </p>
        </div>
      </Card>

      {/* ── PLAN Y PAGO ── */}
      <Card className="!bg-[var(--bg-secondary)]/50 p-8 md:p-12 !rounded-[2rem] md:!rounded-[3rem] border-[var(--border-soft)] flex flex-col items-center relative group shadow-sm">
         <div className="md:absolute top-6 md:left-8 mb-6 md:mb-0">
            <Badge variant="default">Plan Premium OS</Badge>
         </div>
         
         <div className="text-center mb-8 md:mb-10">
            <div className="relative inline-block">
               <span className="text-5xl md:text-7xl font-black italic tracking-tighter text-[var(--text-primary)] select-none">
                 $35
               </span>
               <span className="text-[10px] md:text-sm font-bold text-[var(--brand-accent)] absolute -top-1 -right-8 md:-top-2 md:-right-10">
                 /USD
               </span>
            </div>
            <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-[var(--text-muted)] mt-2 md:mt-4 font-black">
              Mensualidad recurrente
            </p>
         </div>
         
         <Button 
           onClick={handleSubscribe} 
           className="w-full py-4 md:py-5 text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] !rounded-2xl font-bold"
         >
            Renovar núcleo ahora
         </Button>
      </Card>

      <PaymentGatewayModal 
         isOpen={showPaymentModal} 
         onClose={() => setShowPaymentModal(false)}
         onSuccess={handlePaymentSuccess}
      />
    </motion.div>
  );
};
