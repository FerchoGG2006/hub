import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './useCart';
import { useParams } from 'react-router-dom';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { ProductCustomizer } from './ProductCustomizer';

const DELIVERY_OPTIONS = [
  { id: 'mesa',     label: 'En Mesa',  icon: '🪑' },
  { id: 'recoger',  label: 'Recoger',  icon: '🏃' },
  { id: 'domicilio',label: 'Domicilio', icon: '🛵' },
];

const PAYMENT_OPTIONS = [
  { id: 'efectivo',      label: 'Efectivo',      icon: '💵' },
  { id: 'transferencia', label: 'Pago Digital',  icon: '💳' },
];

/* ─── Selector Pill ─── */
const PillBtn = ({ active, onClick, icon, label, accent = '#f59e0b' }) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border text-[10px] font-bold uppercase tracking-wide transition-all duration-200"
    style={{
      background: active ? 'var(--gold-gradient)' : 'rgba(0,0,0,0.04)',
      borderColor: active ? '#C5A059' : 'rgba(0,0,0,0.08)',
      color: active ? '#1a1008' : 'rgba(0,0,0,0.4)',
      boxShadow: active ? 'var(--gold-shadow)' : 'none',
    }}
  >
    <span className="text-lg leading-none">{icon}</span>
    {label}
  </motion.button>
);

export const CheckoutPanel = ({ onClose }) => {
  const { tenantSlug } = useParams();
  const { cart, totalPrice, clearCart, parsePrice, updateQty, updateCustomization } = useCart();

  // URL parsing to detect if scanned from a table QR
  const [urlMesa] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa') || params.get('table');
  });
  const isQrTable = !!urlMesa;

  const [delivery,  setDelivery]  = useState(isQrTable ? 'mesa' : 'domicilio');
  const [payment,   setPayment]   = useState('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNum,  setTableNum]  = useState(urlMesa || '');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const handleFinish = async () => {
    if (!customerName || !phone) {
      alert("Por favor completa tus datos de contacto.");
      return;
    }

    if (delivery === 'domicilio' && !address) {
      alert("Por favor ingresa tu dirección de entrega.");
      return;
    }

    setSending(true);

    const orderPayload = {
      customer_name: customerName,
      phone: phone,
      delivery_method: delivery,
      payment_method: payment === 'transferencia' ? 'wompi' : 'efectivo',
      table_number: delivery === 'mesa' ? tableNum : (delivery === 'domicilio' ? address : null),
      total_price: totalPrice,
      items_json: JSON.stringify(cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        variant_id: i.variant_id,
        customizations: i.customizations
      })))
    };

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/v1/tenant/${tenantSlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      
      if (data.status === 'ok') {
        if (payment === 'transferencia') {
          // Es un pago digital, abrir modal pasándole el orderId
          setActiveOrderId(data.orderId);
          setShowPaymentModal(true);
        } else {
          // Es efectivo, mostrar éxito directamente
          setSent(true);
          clearCart();
        }
      } else {
        alert("Error al procesar el pedido. Intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor.");
    } finally {
      setSending(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSent(true);
    clearCart();
  };

  /* ── Sent confirmation screen ── */
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 px-8"
        style={{ background: 'rgba(249,248,242,0.98)', backdropFilter: 'blur(24px)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-6xl"
        >
          ✅
        </motion.div>
        <h2 className="text-2xl font-black text-dark text-center uppercase tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
          ¡Pedido Recibido!
        </h2>
        <p className="text-sm text-dark/40 text-center leading-relaxed">
          {payment === 'transferencia' 
            ? "Tu pago ha sido confirmado automáticamente. Estamos preparando tu orden."
            : "Te contactaremos en breve para confirmar tu orden."}
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onClose}
          className="mt-4 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest tactile-button"
          style={{ color: '#1a1008' }}
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
        background: 'rgba(249,248,242,0.96)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      <PaymentGatewayModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        paymentData={paymentData}
        orderId={activeOrderId}
      />

      {editingItem && (
        <ProductCustomizer 
          isOpen={!!editingItem} 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={(customs) => updateCustomization(editingItem.instanceId, customs)}
        />
      )}

      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-8 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(26, 26, 26, 0.07)' }}>
        <h2
          className="text-2xl font-black text-dark italic uppercase tracking-tighter leading-none"
        >
          Tu Pedido
        </h2>
        <button
          onClick={onClose}
          className="font-bold text-[10px] uppercase tracking-[0.2em]"
          style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Cerrar ✕
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

        {/* ── Contact Info ── */}
        <section className="space-y-3">
           <p className="text-[10px] text-dark/35 uppercase tracking-[0.3em] mb-3 font-semibold">
            Tus Datos
          </p>
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full py-3 px-4 rounded-xl text-sm text-dark bg-dark/5 border border-dark/10 outline-none focus:border-amber-500/50 transition-all placeholder-dark/30"
          />
          <input 
            type="tel" 
            placeholder="WhatsApp / Teléfono" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full py-3 px-4 rounded-xl text-sm text-dark bg-dark/5 border border-dark/10 outline-none focus:border-amber-500/50 transition-all placeholder-dark/30"
          />
          {delivery === 'domicilio' && (
            <input 
              type="text" 
              placeholder="Dirección exacta de entrega" 
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full py-3 px-4 rounded-xl text-sm text-dark bg-dark/5 border border-dark/10 outline-none focus:border-amber-500/50 transition-all placeholder-dark/30"
            />
          )}
        </section>

        {/* ── Items summary ── */}
        <section>
          <p className="text-[10px] text-dark/35 uppercase tracking-[0.3em] mb-3 font-semibold">
            Resumen
          </p>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.instanceId} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                <div 
                  className="flex flex-col flex-1 cursor-pointer active:opacity-60"
                  onClick={() => setEditingItem(item)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-sm text-dark font-medium truncate max-w-[140px]">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-amber-600 uppercase font-black tracking-tighter">Editar</span>
                  </div>
                  {/* Customization Details */}
                  {item.customizations?.removed?.length > 0 && (
                    <p className="text-[9px] text-red-500/60 uppercase font-bold mt-1">
                      Sin: {item.customizations.removed.join(', ')}
                    </p>
                  )}
                  {item.customizations?.note && (
                    <p className="text-[9px] text-amber-700/60 italic mt-0.5 truncate">
                      "{item.customizations.note}"
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                   {/* Qty Controls */}
                   <div className="flex items-center gap-2 bg-dark/5 rounded-full px-2 py-1">
                      <button onClick={() => updateQty(item.instanceId, -1)} className="text-dark/40 font-bold px-1">&minus;</button>
                      <span className="text-xs text-dark font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.instanceId, 1)} className="text-amber-600 font-bold px-1">+</button>
                   </div>
                   <span className="text-sm font-bold text-amber-700 w-12 text-right"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ${(parsePrice(item.price) * item.qty / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: '1px solid rgba(197, 160, 89, 0.2)' }}>
            <span className="text-xs text-dark/50 uppercase tracking-widest font-bold">Total</span>
            <span className="text-xl font-black text-amber-700"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${(totalPrice / 1000).toFixed(0)}k
            </span>
          </div>
        </section>

        {/* ── Delivery method ── */}
        <section>
          <p className="text-[10px] text-dark/35 uppercase tracking-[0.3em] mb-3 font-semibold">
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
                accent={delivery === opt.id ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(0,0,0,0.04)'}
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
                  className={`w-full py-3 px-4 rounded-xl text-sm text-dark bg-dark/5 border border-dark/10 placeholder-dark/25 outline-none ${isQrTable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    touchAction: 'auto',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Payment method ── */}
        <section>
          <p className="text-[10px] text-dark/35 uppercase tracking-[0.3em] mb-3 font-semibold">
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
                accent={payment === opt.id ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(0,0,0,0.04)'}
              />
            ))}
          </div>

          <p className="text-[9px] text-dark/40 mt-4 text-center leading-relaxed font-medium">
            {payment === 'transferencia' 
              ? "Pagos seguros procesados por Wompi (Nequi, PSE, Tarjetas). Confirmación instantánea."
              : "Paga al recibir tu pedido en efectivo."}
          </p>
        </section>
      </div>

      {/* CTA Button ── */}
      <div className="px-5 pb-8 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <motion.button
          id="confirm-order-btn"
          whileTap={{ scale: 0.94 }}
          onClick={handleFinish}
          disabled={sending || cart.length === 0}
          className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.18em] text-sm relative overflow-hidden tactile-button"
          style={{
            background: sending ? 'rgba(197, 160, 89, 0.5)' : 'var(--gold-gradient)',
            color: '#1a1008',
            boxShadow: 'var(--gold-shadow)',
          }}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>
                ⟳
              </motion.span>
              Procesando…
            </span>
          ) : payment === 'transferencia' ? (
            '💳 Ir a Pagar'
          ) : (
            '✓ Confirmar Pedido'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
