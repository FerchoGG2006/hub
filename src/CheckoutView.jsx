import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { formatWhatsAppMessage, sendToWhatsApp } from './CheckoutLogic';

export const CheckoutView = ({ isOpen, onClose }) => {
  /* CartContext expone `total` como alias de `totalPrice` */
  const { cart, total, clearCart } = useCart();
  const [method,  setMethod]  = useState('mesa');      // mesa | recoger | domicilio
  const [payment, setPayment] = useState('efectivo');  // efectivo | transferencia
  const [receipt, setReceipt] = useState(null);
  const [done, setDone]       = useState(false);

  if (!isOpen) return null;

  /* ── Pantalla de confirmación ── */
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-5 px-8"
        style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="text-6xl"
        >
          🎉
        </motion.span>
        <h2
          className="text-2xl font-black text-white uppercase text-center tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          ¡Pedido enviado!
        </h2>
        <p className="text-sm text-white/35 text-center leading-relaxed max-w-xs">
          Recibirás confirmación en breve. Gracias por usar{' '}
          <span className="text-amber-400 font-bold">hub</span>.
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setDone(false); onClose(); }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest"
          style={{ background: '#f59e0b', color: '#050505', boxShadow: '0 8px 28px rgba(245,158,11,0.4)' }}
        >
          Volver a la carta
        </motion.button>
      </motion.div>
    );
  }

  const handleSend = () => {
    if (payment === 'transferencia' && !receipt) {
      document.getElementById('receipt-zone')?.animate(
        [{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
        { duration: 280, iterations: 3 }
      );
      return;
    }
    const msg = formatWhatsAppMessage(cart, total, method, payment);
    sendToWhatsApp(msg);
    clearCart();
    setDone(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col"
      style={{ touchAction: 'auto' }}
    >
      {/* ── Header ── */}
      <header className="flex justify-between items-center px-6 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h2
          className="text-2xl font-black text-white italic uppercase tracking-tighter"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tu Pedido
        </h2>
        <button
          onClick={onClose}
          className="text-amber-500 font-bold text-xs uppercase tracking-widest"
        >
          Cerrar ✕
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 space-y-8 overflow-y-auto px-6 py-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >

        {/* Items list */}
        <section>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] mb-3 font-semibold">Resumen</p>
          {cart.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-sm text-white/70">
                {item.emoji} {item.name} {item.qty > 1 && <span className="text-white/30">×{item.qty}</span>}
              </span>
              <span className="text-sm font-bold text-amber-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {item.price}
              </span>
            </div>
          ))}
        </section>

        {/* ── Método de Entrega ── */}
        <section>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4 font-semibold">
            ¿Cómo recibes?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'mesa',      icon: '🪑', label: 'Mesa' },
              { id: 'recoger',   icon: '🏃', label: 'Recoger' },
              { id: 'domicilio', icon: '🛵', label: 'Domicilio' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border flex flex-col items-center gap-1`}
                style={{
                  background:  method === opt.id ? '#f59e0b' : 'rgba(255,255,255,0.04)',
                  borderColor: method === opt.id ? '#f59e0b' : 'rgba(255,255,255,0.09)',
                  color:       method === opt.id ? '#050505' : 'rgba(255,255,255,0.38)',
                  boxShadow:   method === opt.id ? '0 4px 16px rgba(245,158,11,0.3)' : 'none',
                }}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Método de Pago ── */}
        <section>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4 font-semibold">
            Forma de Pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment('efectivo')}
              className="py-5 rounded-2xl text-xs font-black uppercase border transition-all"
              style={{
                background:  payment === 'efectivo' ? '#ffffff' : 'rgba(255,255,255,0.04)',
                borderColor: payment === 'efectivo' ? '#ffffff' : 'rgba(255,255,255,0.09)',
                color:       payment === 'efectivo' ? '#050505' : 'rgba(255,255,255,0.38)',
              }}
            >
              💵 Efectivo
            </button>
            <button
              onClick={() => setPayment('transferencia')}
              className="py-5 rounded-2xl text-xs font-black uppercase border transition-all"
              style={{
                background:  payment === 'transferencia' ? '#f59e0b' : 'rgba(255,255,255,0.04)',
                borderColor: payment === 'transferencia' ? '#f59e0b' : 'rgba(255,255,255,0.09)',
                color:       payment === 'transferencia' ? '#050505' : 'rgba(255,255,255,0.38)',
                boxShadow:   payment === 'transferencia' ? '0 4px 20px rgba(245,158,11,0.35)' : 'none',
              }}
            >
              🏦 Transf.
            </button>
          </div>
        </section>

        {/* ── Panel de Transferencia ── */}
        <AnimatePresence>
          {payment === 'transferencia' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22 }}
              className="p-5 rounded-3xl"
              style={{
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <p className="text-[11px] text-amber-500/80 mb-2 font-medium">
                Transfiere a esta cuenta:
              </p>
              <p
                className="text-xl font-mono font-black text-white mb-4 tracking-wider text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                NEQUI: 300 000 0000
              </p>

              {/* Zona de upload */}
              <label
                id="receipt-zone"
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
                style={{
                  background: receipt ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.35)',
                  border: receipt ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span className="text-[9px] text-white/40 uppercase">
                  {receipt ? `✅ ${receipt.name}` : 'Sube tu comprobante'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-[9px] w-32"
                  onChange={e => setReceipt(e.target.files?.[0] ?? null)}
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer con Total y CTA ── */}
      <footer
        className="px-6 pb-8 pt-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex justify-between items-end mb-6">
          <span className="text-white/40 uppercase text-[10px] tracking-widest font-bold">
            Total a Pagar
          </span>
          <span
            className="text-3xl font-black text-white italic tracking-tighter"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            ${(total / 1000).toFixed(0)}k
          </span>
        </div>

        {payment === 'transferencia' && !receipt && (
          <p className="text-center text-[10px] text-amber-400/55 mb-3">
            Adjunta el comprobante para continuar
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSend}
          disabled={cart.length === 0}
          className="w-full py-5 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color:       '#050505',
            boxShadow:   'shadow-amber-500/20',
          }}
        >
          {payment === 'transferencia' ? 'Enviar Pedido + Comprobante' : 'Confirmar Pedido'}
        </motion.button>
      </footer>
    </motion.div>
  );
};
