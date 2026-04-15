import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { formatWhatsAppMessage, sendToWhatsApp } from './CheckoutLogic';

/* ─── Option pill button ─── */
const OptionBtn = ({ label, icon, active, onClick, accentDark = false }) => (
  <motion.button
    whileTap={{ scale: 0.91 }}
    onClick={onClick}
    className="py-4 rounded-2xl text-[11px] font-black uppercase border transition-colors duration-200 flex flex-col items-center gap-1"
    style={{
      background:   active ? (accentDark ? '#fff' : '#f59e0b') : 'rgba(255,255,255,0.04)',
      borderColor:  active ? (accentDark ? '#fff' : '#f59e0b') : 'rgba(255,255,255,0.09)',
      color:        active ? '#050505' : 'rgba(255,255,255,0.38)',
      boxShadow:    active && !accentDark ? '0 4px 20px rgba(245,158,11,0.35)' : 'none',
    }}
  >
    <span className="text-xl leading-none">{icon}</span>
    {label}
  </motion.button>
);

/* ════════════════════════════════════════════════════════════
   CHECKOUT VIEW
════════════════════════════════════════════════════════════ */
export const CheckoutView = ({ isOpen, onClose }) => {
  const { cart, total, totalPrice, clearCart, parsePrice } = useCart();

  /* Resuelve total independientemente del alias que venga del context */
  const totalCOP = totalPrice ?? (typeof total === 'number' ? total : 0);

  const [method,     setMethod]     = useState('mesa');
  const [payment,    setPayment]    = useState('efectivo');
  const [extra,      setExtra]      = useState('');    // nº mesa ó dirección
  const [receipt,    setReceipt]    = useState(null);
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);

  const needsReceipt = payment === 'transferencia' && !receipt;

  const handleSend = () => {
    if (needsReceipt) {
      /* Shake visual — estado temporal */
      document.getElementById('receipt-zone')?.animate(
        [{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
        { duration: 300, iterations: 2 }
      );
      return;
    }

    setSending(true);
    const msg = formatWhatsAppMessage(cart, totalCOP, method, payment, extra, !!receipt);
    setTimeout(() => {
      sendToWhatsApp(msg);
      setSending(false);
      setDone(true);
      clearCart();
    }, 550);
  };

  if (!isOpen) return null;

  /* ── Success screen ── */
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
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-2xl font-black text-white uppercase text-center tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          ¡Pedido enviado!
        </motion.h2>
        <p className="text-sm text-white/35 text-center leading-relaxed max-w-xs">
          Recibirás confirmación en breve. Gracias por elegir{' '}
          <span className="text-amber-400 font-bold">La Rivera</span>.
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onClose}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest"
          style={{ background: '#f59e0b', color: '#050505', boxShadow: '0 8px 28px rgba(245,158,11,0.4)' }}
        >
          Volver a la carta
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 80 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{
        background: 'rgba(5,5,5,0.96)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2
          className="text-xl font-black text-white italic uppercase tracking-tighter"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tu Pedido
        </h2>
        <button
          onClick={onClose}
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(245,158,11,0.8)' }}
        >
          Cerrar ✕
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto px-5 py-5 space-y-7"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
      >

        {/* Items summary */}
        <section>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] mb-3 font-semibold">Resumen</p>
          <div className="space-y-2">
            {cart.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  <span className="text-sm text-white font-medium truncate">{item.name}</span>
                  <span className="text-xs text-white/30 flex-shrink-0">×{item.qty}</span>
                </div>
                <span
                  className="text-sm font-bold text-amber-400 flex-shrink-0 ml-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ${(parsePrice(item.price) * item.qty / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
          {/* Total */}
          <div
            className="flex items-end justify-between mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(245,158,11,0.18)' }}
          >
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total a Pagar</span>
            <span
              className="text-3xl font-black italic tracking-tighter"
              style={{ color: 'white', fontFamily: "'Playfair Display', serif" }}
            >
              ${(totalCOP / 1000).toFixed(0)}k
            </span>
          </div>
        </section>

        {/* ── Delivery method ── */}
        <section>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] block mb-3 font-semibold">
            ¿Cómo recibes?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <OptionBtn icon="🪑" label="Mesa"     active={method === 'mesa'}      onClick={() => setMethod('mesa')} />
            <OptionBtn icon="🏃" label="Recoger"  active={method === 'recoger'}   onClick={() => setMethod('recoger')} />
            <OptionBtn icon="🛵" label="Domicilio" active={method === 'domicilio'} onClick={() => setMethod('domicilio')} />
          </div>
          {/* Extra field */}
          <AnimatePresence>
            {(method === 'mesa' || method === 'domicilio') && (
              <motion.input
                key={method}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 44 }}
                exit={{ opacity: 0, height: 0 }}
                type={method === 'mesa' ? 'number' : 'text'}
                placeholder={method === 'mesa' ? 'Número de mesa' : 'Dirección de entrega'}
                value={extra}
                onChange={e => setExtra(e.target.value)}
                className="mt-2 w-full px-4 rounded-xl text-sm text-white placeholder-white/25 outline-none overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  touchAction: 'auto',
                }}
              />
            )}
          </AnimatePresence>
        </section>

        {/* ── Payment method ── */}
        <section>
          <label className="text-[10px] text-white/30 uppercase tracking-[0.25em] block mb-3 font-semibold">
            Forma de Pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionBtn icon="💵" label="Efectivo"    active={payment === 'efectivo'}      accentDark onClick={() => setPayment('efectivo')} />
            <OptionBtn icon="🏦" label="Transf."     active={payment === 'transferencia'} onClick={() => setPayment('transferencia')} />
          </div>

          {/* Nequi / Receipt panel */}
          <AnimatePresence>
            {payment === 'transferencia' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.22 }}
                className="mt-4 p-4 rounded-3xl space-y-4"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.18)',
                }}
              >
                <div>
                  <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mb-1">
                    Transfiere a esta cuenta
                  </p>
                  <p
                    className="text-xl font-black text-white tracking-wider text-center"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    NEQUI: 300 000 0000
                  </p>
                  <p className="text-[10px] text-white/25 text-center mt-0.5">
                    A nombre de: La Rivera Tech Gastro
                  </p>
                </div>

                {/* File upload zone */}
                <label
                  id="receipt-zone"
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: receipt ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)',
                    border: receipt ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{receipt ? '✅' : '📷'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white/70 truncate">
                      {receipt ? receipt.name : 'Sube tu comprobante'}
                    </p>
                    <p className="text-[10px] text-white/30">
                      {receipt ? 'Listo para enviar' : 'JPG, PNG o captura de pantalla'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setReceipt(e.target.files?.[0] ?? null)}
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ── Footer / CTA ── */}
      <footer
        className="px-5 pb-8 pt-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {needsReceipt && (
          <p className="text-center text-[10px] text-amber-400/60 mb-2">
            Adjunta el comprobante para continuar
          </p>
        )}
        <motion.button
          id="checkout-confirm-btn"
          whileTap={{ scale: 0.94 }}
          onClick={handleSend}
          disabled={sending || cart.length === 0}
          className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.18em] text-sm relative overflow-hidden"
          style={{
            background: sending
              ? 'rgba(245,158,11,0.4)'
              : `linear-gradient(135deg, #f59e0b, #d97706)`,
            color: '#050505',
            boxShadow: '0 8px 30px rgba(245,158,11,0.35)',
          }}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              >
                ⟳
              </motion.span>
              Enviando…
            </span>
          ) : payment === 'transferencia' ? (
            '📲 Enviar Pedido + Comprobante'
          ) : (
            '✓ Confirmar Pedido'
          )}
        </motion.button>
      </footer>
    </motion.div>
  );
};
