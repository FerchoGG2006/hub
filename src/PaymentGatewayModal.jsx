import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

export const PaymentGatewayModal = ({ isOpen, onClose, onSuccess }) => {
  const { tenantSlug } = useParams();
  const [step, setStep] = useState(1); // 1 = Details, 2 = Processing, 3 = Success

  if (!isOpen) return null;

  const handlePay = (e) => {
    e.preventDefault();
    setStep(2);

    // Simulate Payment Processing
    setTimeout(() => {
      setStep(3);
      // Let it sit on success screen for a moment
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }, 2500);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && step === 1) onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleBackdrop}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden relative shadow-2xl"
          style={{ boxShadow: '0 25px 50px -12px rgba(245,158,11,0.25)' }}
        >
          {/* Header */}
          <div className="bg-[#111] p-6 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
             <div>
                <h3 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
                   HUB SaaS <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] uppercase tracking-widest">Renovación</span>
                </h3>
                <p className="text-white/40 text-[10px] mt-1 font-mono">{tenantSlug}.hubsaas.com</p>
             </div>
             <div className="text-right">
                <p className="text-3xl font-light text-white">$35<span className="text-sm text-white/40">.00</span></p>
             </div>
          </div>

          <div className="p-6">
             {step === 1 && (
               <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handlePay} className="space-y-5">
                 <div>
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 block mb-2">Correo Electrónico</label>
                   <input required type="email" defaultValue={`${tenantSlug}@admin.com`} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors text-white/80" />
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 block">Información de Pago</label>
                   <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111] focus-within:border-amber-500 transition-colors">
                      <div className="border-b border-white/10 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">💳</span>
                        <input required placeholder="Número de tarjeta" type="text" maxLength="19" className="w-full bg-transparent px-10 py-3 text-sm outline-none text-white tracking-widest font-mono placeholder-white/20" />
                      </div>
                      <div className="flex">
                        <div className="flex-1 border-r border-white/10">
                          <input required placeholder="MM / AA" type="text" maxLength="5" className="w-full bg-transparent px-4 py-3 text-sm outline-none text-white text-center font-mono placeholder-white/20" />
                        </div>
                        <div className="w-24 relative">
                          <input required placeholder="CVC" type="text" maxLength="4" className="w-full bg-transparent px-4 py-3 text-sm outline-none text-white text-center font-mono placeholder-white/20" />
                        </div>
                      </div>
                   </div>
                   <input required placeholder="Nombre en la tarjeta" type="text" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors text-white" />
                 </div>

                 <button type="submit" className="w-full mt-6 py-4 bg-amber-500 text-black text-[11px] uppercase tracking-[0.2em] font-black rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(245,158,11,0.2)]">
                   Pagar $35.00
                 </button>
                 
                 <div className="flex justify-center items-center gap-2 mt-4 text-[9px] text-white/30 tracking-widest font-mono">
                   <span className="text-white/40">🔒</span> PAGOS ENCRIPTADOS Y SEGUROS
                 </div>
               </motion.form>
             )}

             {step === 2 && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6">
                 <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                 <div className="text-center">
                   <p className="text-white font-bold tracking-tight text-lg mb-1">Procesando Pago...</p>
                   <p className="text-white/40 text-[10px] tracking-widest uppercase">Contactando pasarela bancaria</p>
                 </div>
               </motion.div>
             )}

             {step === 3 && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-6">
                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-5xl">
                   ✓
                 </motion.div>
                 <div className="text-center">
                   <p className="text-emerald-500 font-bold tracking-tight text-xl mb-1">¡Pago Exitoso!</p>
                   <p className="text-white/50 text-sm tracking-wider">Tu suscripción ha sido renovada por 30 días.</p>
                 </div>
               </motion.div>
             )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
