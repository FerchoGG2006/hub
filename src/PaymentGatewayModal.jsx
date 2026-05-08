import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentGatewayModal = ({ isOpen, onClose, onSuccess, orderId }) => {
  // const { tenantSlug } = useParams();
  const [step, setStep] = useState(1); // 1: Loading, 2: QR/Portal, 3: Verifying, 4: Success
  const [paymentData, setPaymentData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const initPayment = async () => {
      if (paymentData) return; // Evitar re-inicializar si ya tenemos datos
      setStep(1);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/payments/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, provider: 'wompi' })
        });
        const data = await res.json();
        setPaymentData(data);
        setStep(2);
      } catch (err) {
        console.error("Error creating payment session:", err);
      }
    };

    initPayment();
  }, [isOpen, orderId, paymentData]);

  // Effect 2: Status Monitoring (Polling + WS)
  useEffect(() => {
    if (!isOpen || !paymentData?.reference) return;

    // WebSocket listener
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace('http', 'ws') + '/ws/menu';
    const ws = new WebSocket(wsUrl);

    // POLLING FALLBACK
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}/payments/status/${paymentData.reference}`);
        const data = await res.json();
        
        if (data.status === 'paid') {
          setStep(4);
          clearInterval(pollInterval);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        } else if (data.status === 'failed' || data.status === 'expired') {
          alert("El pago no pudo completarse. Por favor intenta de nuevo.");
          onClose();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ORDER_UPDATED' && data.order_id === orderId) {
        if (data.status === 'paid') {
          setStep(4);
          clearInterval(pollInterval);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        }
      }
    };

    return () => {
      ws.close();
      clearInterval(pollInterval);
    };
  }, [isOpen, paymentData?.reference, orderId, onSuccess, onClose]);

  // Effect 3: Timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-[#050505] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
             <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 900, ease: 'linear' }} className="h-full bg-amber-500" />
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">Checkout Hub</h3>
                <p className="text-white/30 text-[10px] font-mono mt-1">ORD: #{orderId} | REF: {paymentData?.reference || '...'}</p>
              </div>
              <div className="text-right">
                <span className="text-amber-500 font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
                <p className="text-white/20 text-[8px] uppercase tracking-widest">Tiempo restante</p>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px] flex flex-col justify-center">
              {step === 1 && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Generando sesión segura...</p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-1 aspect-square border border-white/10 overflow-hidden relative group">
                    <iframe src={paymentData?.paymentUrl} className="w-full h-full rounded-xl" title="Payment" />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] text-center font-bold">Usa Nequi, PSE o Tarjetas</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(3)} className="w-full py-4 bg-white/5 border border-white/10 text-white text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-white/10 transition-all">
                    Ya pagué, verificar ahora
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center py-10 space-y-4">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full" />
                    <div className="absolute inset-0 border-2 border-t-amber-500 rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">Verificando Pago</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Estamos esperando la confirmación del banco</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-10">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 text-5xl mb-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                    ✓
                  </div>
                  <h4 className="text-emerald-500 font-black text-2xl uppercase italic">¡Pago Exitoso!</h4>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mt-2">La cocina ya recibió tu orden</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
               <div className="flex gap-2">
                 {['Nequi', 'PSE', 'Visa'].map(m => (
                   <span key={m} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] text-white/40 uppercase tracking-tighter">{m}</span>
                 ))}
               </div>
               <button onClick={onClose} className="text-white/30 hover:text-white text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
