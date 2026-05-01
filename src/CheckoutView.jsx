import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './useCart';
import { formatWhatsAppMessage, sendToWhatsApp } from './CheckoutLogic';
import { ProductCustomizer } from './ProductCustomizer';

export const CheckoutView = ({ isOpen, onClose, config, branch }) => {
  const { cart, total, clearCart, updateQty, updateCustomization } = useCart();
  const [method,  setMethod]  = useState('mesa');      // mesa | recoger | domicilio
  const [payment, setPayment] = useState('efectivo');  // efectivo | transferencia
  const [done, setDone]       = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('checkout-open');
    } else {
      document.body.classList.remove('checkout-open');
    }
    return () => document.body.classList.remove('checkout-open');
  }, [isOpen]);

  if (!isOpen) return null;

  /* ── Pantalla de confirmación ── */
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-5 px-8"
        style={{ background: 'rgba(249,248,242,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
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
          className="text-2xl font-black text-dark uppercase text-center tracking-tight"
          style={{ fontStyle: 'italic' }}
        >
          ¡Pedido Enviado!
        </h2>
        <p className="text-sm text-dark/35 text-center leading-relaxed max-w-xs">
          La orden ya está en nuestra cocina y en nuestro WhatsApp. Gracias por usar{' '}
          <span className="text-amber-500 font-bold">hub</span>.
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { 
            setDone(false); 
            onClose();
            // Reset PageFlip to page 0 if possible
            if (window.pflipInstance) {
              // eslint-disable-next-line no-unused-vars
              try { window.pflipInstance.turnToPage(0); } catch (_e) { /* ignore if instance is busy */ }
            }
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest tactile-button"
          style={{ color: '#F9F8F2', boxShadow: '0 8px 28px rgba(197,160,89,0.4)' }}
        >
          Volver a la carta
        </motion.button>
      </motion.div>
    );
  }

  const handleSend = async () => {
    if (!customerName) {
      alert("Por favor ingresa tu nombre de pedido.");
      return;
    }
    const tableParam = new URLSearchParams(window.location.search).get('mesa');
    
    if (method === 'domicilio' && !address) {
      alert("Por favor ingresa la dirección de entrega.");
      return;
    }
    if (method === 'mesa' && !tableParam && !tableNumber) {
      alert("Por favor ingresa el número de tu mesa.");
      return;
    }

    const finalLocation = method === 'mesa' ? (tableParam || tableNumber) : (method === 'domicilio' ? address : 'Para Recoger');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const tenantSlug = window.location.pathname.split('/t/')[1]?.split('?')[0]?.split('/')[0] || '';
    
    // 1. Send to Live Kitchen (API)
    try {
      await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items_json: JSON.stringify(cart),
          total_price: total,
          customer_name: customerName,
          phone: "0000",
          table_number: finalLocation,
          delivery_method: method,
          payment_method: payment,
          branch_id: branch?.id
        })
      });
    } catch(err) {
      console.warn("No se pudo enviar al Kanban:", err);
    }

    // 2. Open WhatsApp
    const waNumber = branch?.whatsapp_number || config?.whatsapp_number || '573000000000';
    const locationLabel = method === 'domicilio' ? 'Dirección' : method === 'mesa' ? 'Mesa' : 'Recogida';
    const waNameLine = `👤 Cliente: *${customerName}*\n📍 ${locationLabel}: *${finalLocation}*\n🏛️ Sede: *${branch?.name || 'Central'}*\n\n`;
    const msg = formatWhatsAppMessage(cart, total, method, payment, config?.name);
    sendToWhatsApp(waNumber, waNameLine + msg);
    
    clearCart();
    setDone(true);
    
    // Reset PageFlip
    if (window.pflipInstance) {
      // eslint-disable-next-line no-unused-vars
      try { window.pflipInstance.turnToPage(0); } catch (_e) { /* ignore if instance is busy */ }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed inset-0 z-[300] bg-bone/95 backdrop-blur-3xl flex flex-col"
      style={{ touchAction: 'auto' }}
    >
      {/* ── Customizer Modal ── */}
      {editingItem && (
        <ProductCustomizer 
          isOpen={!!editingItem} 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={(customs) => updateCustomization(editingItem.instanceId, customs)}
        />
      )}

      {/* ── Header ── */}
      <header className="flex justify-between items-center px-6 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(26, 26, 26, 0.07)' }}>
        <h2
          className="text-2xl font-black text-dark italic uppercase tracking-tighter"
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

        {/* Customer Info */}
        <section className="mb-6">
          <label className="text-[10px] text-dark/30 uppercase tracking-[0.2em] block mb-4 font-semibold">Tus Datos</label>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="¿A nombre de quién hacemos el pedido?" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/30 text-dark"
            />
            {method === 'domicilio' && (
              <input 
                type="text" 
                placeholder="Dirección exacta de entrega" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/30 text-dark"
              />
            )}
            {method === 'mesa' && !new URLSearchParams(window.location.search).get('mesa') && (
              <input 
                type="text" 
                placeholder="Número de mesa" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
                className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/30 text-dark"
              />
            )}
          </div>
        </section>

        {/* Items list */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-dark/30 uppercase tracking-[0.25em] font-semibold">Resumen de tu Orden</p>
            <p className="text-[9px] text-amber-500/40 uppercase font-black tracking-widest">Toca un plato para personalizar</p>
          </div>
          {cart.map(item => (
            <div
              key={item.instanceId}
              className="flex items-center justify-between py-4 group"
              style={{ borderBottom: '1px solid rgba(26,26,26,0.05)' }}
            >
              <div 
                className="flex flex-col flex-1 cursor-pointer active:opacity-60 transition-opacity"
                onClick={() => setEditingItem(item)}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] text-dark/90 font-black tracking-wide uppercase">
                    {item.name}
                  </span>
                  <span className="text-[10px] bg-dark/5 text-dark/40 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">Editar</span>
                </div>
                
                {/* Customization Badges */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.customizations?.removed?.length > 0 && (
                    <span className="text-[8px] font-black uppercase text-red-400/80 tracking-widest">
                      Sin: {item.customizations.removed.join(', ')}
                    </span>
                  )}
                  {item.customizations?.note && (
                    <span className="text-[8px] font-black uppercase text-amber-500/80 tracking-widest block w-full truncate italic">
                      " {item.customizations.note} "
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-amber-500/80 mt-1">
                  {item.price}
                </span>
              </div>
              
              {/* Product Quantity Modifiers */}
              <div className="flex items-center bg-dark/[0.04] rounded-full border border-dark/5 px-1 py-1 gap-1">
                 <button 
                    onClick={() => updateQty(item.instanceId, -1)} 
                    className="w-7 h-7 flex items-center justify-center rounded-full text-dark/40 hover:bg-dark/10 hover:text-dark transition-colors"
                 >
                   <span className="font-bold text-lg leading-none mt-[-2px]">&minus;</span>
                 </button>
                 <span className="text-[11px] font-black text-dark w-4 text-center">{item.qty}</span>
                 <button 
                    onClick={() => updateQty(item.instanceId, 1)} 
                    className="w-7 h-7 flex items-center justify-center rounded-full text-amber-500 hover:bg-amber-500/20 transition-colors"
                 >
                   <span className="font-bold text-lg leading-none mt-[-2px]">+</span>
                 </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <p className="text-white/30 text-xs italic">Tu carrito está vacío.</p>}
        </section>

        {/* ── Método de Entrega ── */}
        <section>
          <label className="text-[10px] text-dark/30 uppercase tracking-[0.2em] block mb-4 font-semibold">
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
                  background:  method === opt.id ? '#C5A059' : 'rgba(26,26,26,0.04)',
                  borderColor: method === opt.id ? '#C5A059' : 'rgba(26,26,26,0.09)',
                  color:       method === opt.id ? '#F9F8F2' : 'rgba(26,26,26,0.38)',
                  boxShadow:   method === opt.id ? '0 4px 16px rgba(197,160,89,0.3)' : 'none',
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
          <label className="text-[10px] text-dark/30 uppercase tracking-[0.2em] block mb-4 font-semibold">
            Forma de Pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment('efectivo')}
              className="py-5 rounded-2xl text-xs font-black uppercase border transition-all"
              style={{
                background:  payment === 'efectivo' ? '#1A1A1A' : 'rgba(26,26,26,0.04)',
                borderColor: payment === 'efectivo' ? '#1A1A1A' : 'rgba(26,26,26,0.09)',
                color:       payment === 'efectivo' ? '#F9F8F2' : 'rgba(26,26,26,0.38)',
              }}
            >
              💵 Efectivo
            </button>
            <button
              onClick={() => setPayment('transferencia')}
              className="py-5 rounded-2xl text-xs font-black uppercase border transition-all"
              style={{
                background:  payment === 'transferencia' ? '#C5A059' : 'rgba(26,26,26,0.04)',
                borderColor: payment === 'transferencia' ? '#C5A059' : 'rgba(26,26,26,0.09)',
                color:       payment === 'transferencia' ? '#F9F8F2' : 'rgba(26,26,26,0.38)',
                boxShadow:   payment === 'transferencia' ? '0 4px 20px rgba(197,160,89,0.35)' : 'none',
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
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="p-5 rounded-3xl overflow-hidden mt-2"
              style={{
                background: 'rgba(197,160,89,0.07)',
                border: '1px solid rgba(197,160,89,0.2)',
              }}
            >
              <p className="text-[10px] text-amber-500/80 mb-3 font-medium uppercase tracking-widest text-center">
                Datos Bancarios
              </p>
              
              <div className="bg-dark/10 w-full rounded-2xl p-4 mb-4 flex flex-col items-center justify-center border border-dark/5 shadow-inner">
                <p className="text-[9px] text-dark/40 uppercase tracking-widest font-black mb-1.5">NEQUI / BANCOLOMBIA</p>
                <p
                  className="text-2xl font-black text-dark tracking-widest text-center"
                >
                  300 000 0000
                </p>
              </div>

              <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 mt-1">
                <span className="text-xl leading-none">💬</span>
                <p className="text-[10px] text-dark/60 leading-relaxed font-medium">
                  Al confirmar, serás redirigido a WhatsApp. <span className="text-amber-400 font-bold block mt-1">Envía el mensaje de la orden y adjunta la foto de tu comprobante.</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer con Total y CTA ── */}
      <footer
        className="px-6 pb-8 pt-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(26,26,26,0.07)' }}
      >
        <div className="flex justify-between items-end mb-6">
          <span className="text-dark/40 uppercase text-[10px] tracking-widest font-bold">
            Total a Pagar
          </span>
          <span
            className="text-2xl font-black text-dark italic tracking-tighter"
          >
            ${(total / 1000).toFixed(0)}k
          </span>
        </div>

        {payment === 'transferencia' && (
          <p className="text-center text-[10px] text-amber-400/55 mb-3 font-semibold uppercase tracking-widest">
            Abre WhatsApp con 1 toque
          </p>
        )}

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSend}
          disabled={cart.length === 0}
          className="w-full py-5 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #C5A059, #A68648)',
            color:       '#F9F8F2',
            boxShadow:   '0 10px 30px rgba(197,160,89,0.25)',
          }}
        >
          {payment === 'transferencia' ? 'Reportar Transferencia' : 'Confirmar Pedido'}
        </motion.button>
      </footer>
    </motion.div>
  );
};
