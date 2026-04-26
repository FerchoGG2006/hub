import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './useCart';
const DELIVERY_OPTIONS = [
  { id: 'mesa',     label: 'En Mesa',  icon: '🪑' },
  { id: 'recoger',  label: 'Recoger',  icon: '🏃' },
  { id: 'domicilio',label: 'Domicilio', icon: '🛵' },
];

const PAYMENT_OPTIONS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: '💵' },
  { id: 'transferencia', label: 'Transferencia',  icon: '📲' },
];

/* ─── Selector Pill ─── */
const PillBtn = ({ active, onClick, icon, label, accent = '#f59e0b' }) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-wide transition-all duration-200"
    style={{
      background: active ? accent : 'rgba(255,255,255,0.04)',
      borderColor: active ? accent : 'rgba(255,255,255,0.08)',
      color: active ? '#050505' : 'rgba(255,255,255,0.4)',
      boxShadow: active ? `0 4px 20px ${accent}44` : 'none',
    }}
  >
    <span className="text-lg leading-none">{icon}</span>
    {label}
  </motion.button>
);

export const CheckoutPanel = ({ onClose }) => {
  const { cart, totalPrice, clearCart, parsePrice } = useCart();

  // URL parsing to detect if scanned from a table QR
  const [urlMesa] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa') || params.get('table');
  });
  const isQrTable = !!urlMesa;

  const [delivery,  setDelivery]  = useState(isQrTable ? 'mesa' : 'domicilio');
  const [payment,   setPayment]   = useState('efectivo');
  const [receipt,   setReceipt]   = useState(null);
  const [tableNum,  setTableNum]  = useState(urlMesa || '');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);

  const NEQUI_NUMBER = '300 000 0000';
  const WA_NUMBER    = '573001234567'; // ← reemplazar por número real

  const buildMessage = () => {
    const items = cart.map(i => `  • ${i.name} x${i.qty} — $${(parsePrice(i.price) * i.qty / 1000).toFixed(0)}k`).join('\n');
    const deliveryLabel = DELIVERY_OPTIONS.find(d => d.id === delivery)?.label;
    const tableInfo = delivery === 'mesa' && tableNum ? `\n*Mesa:* ${tableNum}` : '';
    return encodeURIComponent(
      `*🍽️ NUEVO PEDIDO — LA RIVERA TECH GASTRO*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${items}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Total:* $${(totalPrice / 1000).toFixed(0)}k\n` +
      `*Entrega:* ${deliveryLabel}${tableInfo}\n` +
      `*Pago:* ${PAYMENT_OPTIONS.find(p => p.id === payment)?.label}\n` +
      (payment === 'transferencia' ? `*(Comprobante adjunto)*` : '')
    );
  };

  const handleFinish = () => {
    if (payment === 'transferencia' && !receipt) {
      // Shake the receipt button instead of alert
      return;
    }
    setSending(true);
    setTimeout(() => {
      window.open(`https://wa.me/${WA_NUMBER}?text=${buildMessage()}`, '_blank');
      setSent(true);
      setSending(false);
      clearCart();
    }, 600);
  };

  /* ── Sent confirmation screen ── */
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 px-8"
        style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(24px)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-6xl"
        >
          ✅
        </motion.div>
        <h2 className="text-2xl font-black text-white text-center uppercase tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
          ¡Pedido enviado!
        </h2>
        <p className="text-sm text-white/40 text-center leading-relaxed">
          Te contactaremos en breve para confirmar tu orden.
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onClose}
          className="mt-4 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest"
          style={{ background: '#f59e0b', color: '#050505' }}
        >
          Volver a la carta
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{
        background: 'rgba(5,5,5,0.96)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest font-bold"
        >
          ← Carta
        </motion.button>
        <h2
          className="text-lg font-black text-white uppercase tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          Tu Pedido
        </h2>
        <div className="w-16" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

        {/* ── Items summary ── */}
        <section>
          <p className="text-[10px] text-white/35 uppercase tracking-[0.3em] mb-3 font-semibold">
            Resumen
          </p>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-sm text-white font-medium truncate max-w-[140px]">
                    {item.name}
                  </span>
                  <span className="text-xs text-white/30">×{item.qty}</span>
                </div>
                <span className="text-sm font-bold text-amber-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(parsePrice(item.price) * item.qty / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Total</span>
            <span className="text-xl font-black text-amber-400"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${(totalPrice / 1000).toFixed(0)}k
            </span>
          </div>
        </section>

        {/* ── Delivery method ── */}
        <section>
          <p className="text-[10px] text-white/35 uppercase tracking-[0.3em] mb-3 font-semibold">
            {isQrTable ? "Mesa Asignada" : "¿Dónde recibes?"}
          </p>
          <div className={`grid ${isQrTable ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {(isQrTable ? DELIVERY_OPTIONS.filter(o => o.id === 'mesa') : DELIVERY_OPTIONS.filter(o => o.id !== 'mesa')).map(opt => (
              <PillBtn
                key={opt.id}
                active={delivery === opt.id}
                onClick={() => !isQrTable && setDelivery(opt.id)}
                icon={opt.icon}
                label={opt.label}
              />
            ))}
          </div>
          {/* Mesa number input */}
          <AnimatePresence>
            {delivery === 'mesa' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Número de mesa"
                  value={tableNum}
                  disabled={isQrTable}
                  onChange={e => setTableNum(e.target.value)}
                  className={`w-full py-3 px-4 rounded-xl text-sm text-white placeholder-white/25 outline-none ${isQrTable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    touchAction: 'auto',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Payment method ── */}
        <section>
          <p className="text-[10px] text-white/35 uppercase tracking-[0.3em] mb-3 font-semibold">
            ¿Cómo pagas?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <PillBtn
                key={opt.id}
                active={payment === opt.id}
                onClick={() => setPayment(opt.id)}
                icon={opt.icon}
                label={opt.label}
                accent={opt.id === 'efectivo' ? '#ffffff' : '#f59e0b'}
              />
            ))}
          </div>

          {/* Transfer panel */}
          <AnimatePresence>
            {payment === 'transferencia' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 p-4 rounded-2xl space-y-4"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Nequi / Bancolombia</p>
                  <p className="text-xl font-bold text-amber-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {NEQUI_NUMBER}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">A nombre de: La Rivera Tech Gastro</p>
                </div>

                {/* File input */}
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Adjuntar Comprobante</p>
                  <label
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: receipt ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                      border: receipt ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <span className="text-xl">{receipt ? '✅' : '📷'}</span>
                    <div>
                      <p className="text-xs font-bold text-white/70">
                        {receipt ? receipt.name : 'Seleccionar imagen'}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {receipt ? 'Comprobante adjunto' : 'JPG, PNG o captura de pantalla'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setReceipt(e.target.files[0] || null)}
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ── CTA Button ── */}
      <div className="px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button
          id="confirm-order-btn"
          whileTap={{ scale: 0.94 }}
          onClick={handleFinish}
          disabled={sending || cart.length === 0}
          className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.18em] text-sm relative overflow-hidden"
          style={{
            background: sending ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#050505',
            boxShadow: '0 8px 30px rgba(245,158,11,0.35)',
          }}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>
                ⟳
              </motion.span>
              Enviando…
            </span>
          ) : payment === 'transferencia' ? (
            '📲 Enviar Pago y Confirmar'
          ) : (
            '✓ Confirmar Pedido'
          )}
        </motion.button>

        {payment === 'transferencia' && !receipt && (
          <p className="text-center text-[10px] text-amber-400/60 mt-2">
            Adjunta el comprobante para continuar
          </p>
        )}
      </div>
    </motion.div>
  );
};
