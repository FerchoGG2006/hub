import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../shared/hooks/useCart';
import { useParams } from 'react-router-dom';
import { PaymentGatewayModal } from '../tenants/components/PaymentGatewayModal';
import { ProductCustomizer } from './ProductCustomizer';
import { MENU_DATA } from './MenuData';

export const CheckoutPanel = ({ onClose, isSidebar = false }) => {
  const { tenantSlug } = useParams();
  const { cart, totalPrice, clearCart, parsePrice, updateQty, updateCustomization, addToCart } = useCart();

  const [urlMesa] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa') || params.get('table');
  });
  const isQrTable = !!urlMesa;

  const [delivery, setDelivery] = useState(isQrTable ? 'mesa' : 'pick');
  const [payment, setPayment] = useState('digital');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNum, setTableNum] = useState(urlMesa || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [bumpBadge, setBumpBadge] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    if (totalQty > 0) {
      setBumpBadge(true);
      const timer = setTimeout(() => setBumpBadge(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalQty]);

  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];
    // Flatten MENU_DATA to find categories, or just use specific ones
    const licores = MENU_DATA["Licores"] || MENU_DATA["Bebidas"] || [];
    const cartIds = new Set(cart.map(item => item.id));
    
    return licores
      .filter(item => !cartIds.has(item.id))
      .slice(0, 2)
      .map(item => ({
        ...item,
        priceNum: parseInt(item.price.replace('$', '').replace('k', '')) * 1000,
      }));
  }, [cart]);

  const handleFinish = async () => {
    if (!customerName || !phone) {
      alert("Por favor completa tu nombre y número de WhatsApp.");
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
      payment_method: payment === 'digital' ? 'wompi' : 'efectivo',
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/v1/tenant/${tenantSlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      const isSuccess = data.status === 'ok' || data.success === true;
      const orderId = data.orderId || data.data?.orderId;
      
      if (isSuccess) {
        if (payment === 'digital') {
          setActiveOrderId(orderId);
          setShowPaymentModal(true);
        } else {
          const lines = cart.map(i => `  ${i.qty}x ${i.name} — $${(parsePrice(i.price) * i.qty / 1000).toFixed(0)}k`).join('\n');
          const totalStr = `$${((totalPrice + (delivery === 'domicilio' ? 5000 : 0)) / 1000).toFixed(0)}k`;
          const msg = `Hola! Quiero hacer un pedido en ${tenantSlug.toUpperCase()} 🍽️\n\n*Nombre:* ${customerName}\n*Tel:* ${phone}\n*Tipo:* ${delivery === 'domicilio' ? 'Domicilio' : 'Recoger en sitio'}\n*Pago:* Efectivo\n\n*Pedido:*\n${lines}\n\n*Total: ${totalStr}*\n\nPedido generado por Platorin ✅`;
          window.open('https://wa.me/573001234567?text=' + encodeURIComponent(msg), '_blank');
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

  const askWa = () => {
    window.open(`https://wa.me/573001234567?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20el%20menú%20de%20${tenantSlug.toUpperCase()}`, '_blank');
  };

  const handlePaymentSuccess = () => {
    setSent(true);
    clearCart();
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 px-8"
        style={{ background: 'transparent' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="text-6xl"
        >
          ✅
        </motion.div>
        <h2 className="text-2xl font-bold italic text-[#17110A] text-center uppercase tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          ¡Pedido Recibido!
        </h2>
        <p className="text-xs text-[#17110A]/60 text-center leading-relaxed max-w-[280px]">
          {payment === 'digital' 
            ? "Tu pago ha sido confirmado automáticamente. Estamos preparando tu orden."
            : "Te contactaremos en breve para confirmar tu orden."}
        </p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setSent(false); if (onClose) onClose(); }}
          className="mt-4 px-10 py-4 rounded-full font-bold uppercase text-xs tracking-widest"
          style={{ color: '#FFFFFF', background: '#1B5E38' }}
        >
          Volver a la carta
        </motion.button>
      </motion.div>
    );
  }

  const subtotal = totalPrice;
  const domFee = delivery === 'domicilio' ? 5000 : 0;
  const total = subtotal + domFee;

  return (
    <div className="cart-panel-scope h-full w-full">
      <style>{`
        .cart-panel-scope {
          --ink:       #17110A;
          --ink-55:    rgba(23,17,10,.55);
          --ink-25:    rgba(23,17,10,.25);
          --ink-10:    rgba(23,17,10,.1);
          --ink-05:    rgba(23,17,10,.05);
          --green:     #1B5E38;
          --green-l:   #E6F2EC;
          --green-xd:  #0F3D22;
          --wa:        #25D366;
          --gold:      #B87D1A;
          --gold-l:    rgba(184, 125, 26, 0.08);
          --red:       #C0392B;
          --white:     #FFFFFF;
          --r1: 8px; --r2: 14px; --r3: 20px; --r4: 28px;
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans:  'Plus Jakarta Sans', system-ui, sans-serif;
          --ease: cubic-bezier(.16,1,.3,1);
        }

        .cart {
          width: 100%;
          height: 100%;
          background: transparent;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--sans);
          color: var(--ink);
        }
        .cart-top {
          padding: 1.25rem 1.25rem 0.75rem;
          border-bottom: 1px solid var(--ink-10);
          flex-shrink: 0;
        }
        .cart-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.8rem;
        }
        .cart-title {
          font-family: var(--serif);
          font-style: italic;
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--ink);
          letter-spacing: -.01em;
        }
        .cart-badge {
          min-width: 22px;
          height: 22px;
          border-radius: 99px;
          background: var(--green);
          color: var(--white);
          font-size: .62rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 .4rem;
          transition: transform .2s var(--ease);
        }
        .cart-badge.bump { animation: bump .25s var(--ease) }
        @keyframes bump { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }

        .mini-field {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border: 1.5px solid var(--ink-10);
          border-radius: var(--r1);
          font-size: .76rem;
          font-family: var(--sans);
          color: var(--ink);
          background: rgba(255,255,255,0.6);
          outline: none;
          transition: border .2s;
          margin-bottom: 0.5rem;
        }
        .mini-field:focus { border-color: var(--green); background: #FFF; }
        .mini-field::placeholder { color: var(--ink-25); }

        .cart-scroll-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          scrollbar-width: none;
        }
        .cart-scroll-area::-webkit-scrollbar { display: none; }

        .cart-items {
          padding: 0.5rem 1.25rem;
          flex-shrink: 0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          padding: 2.5rem 1rem;
          text-align: center;
        }
        .es-icon { font-size: 2rem; opacity: .2; }
        .es-txt {
          font-family: var(--serif);
          font-style: italic;
          font-size: 0.95rem;
          color: var(--ink-55);
          line-height: 1.5;
        }
        .es-sub { font-size: .7rem; color: var(--ink-25); font-weight: 300; }

        .ci {
          display: flex;
          align-items: center;
          gap: .6rem;
          padding: .65rem 0;
          border-bottom: 1px solid var(--ink-05);
        }
        .ci:last-child { border-bottom: none; }
        .ci-q {
          width: 20px;
          height: 20px;
          border-radius: 5px;
          background: var(--green);
          color: var(--white);
          font-size: .6rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ci-name {
          flex: 1;
          font-size: .76rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.2;
        }
        .ci-p {
          font-size: .76rem;
          font-weight: 800;
          color: var(--green);
          flex-shrink: 0;
        }
        .ci-rm {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--ink-25);
          font-size: .7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all .14s;
          flex-shrink: 0;
        }
        .ci-rm:hover { background: rgba(192,57,43,.08); color: var(--red); }

        .rec-strip {
          padding: 0.8rem 1.25rem;
          border-top: 1px solid var(--ink-10);
          flex-shrink: 0;
        }
        .rec-lbl {
          font-size: .56rem;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.5rem;
        }
        .rec-row {
          display: flex;
          flex-direction: column;
          gap: .35rem;
        }
        .rec-item {
          display: flex;
          align-items: center;
          gap: .5rem;
          padding: .4rem .5rem;
          border-radius: var(--r1);
          background: var(--gold-l);
          border: 1px solid rgba(200,137,26,.1);
          cursor: pointer;
          transition: background .15s;
        }
        .rec-item:hover { background: rgba(200,137,26,.18); }
        .ri-img {
          width: 28px;
          height: 28px;
          border-radius: 5px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ri-info { flex: 1; min-width: 0; }
        .ri-name { font-size: .68rem; font-weight: 600; color: var(--ink); line-height: 1.2; }
        .ri-sub { font-size: .58rem; color: var(--ink-55); font-weight: 300; }
        .ri-add { font-size: .6rem; font-weight: 700; color: var(--green); flex-shrink: 0; }

        .cart-foot {
          padding: 1rem 1.25rem 1.25rem;
          border-top: 1px solid var(--ink-10);
          flex-shrink: 0;
        }
        .field-label {
          font-size: .58rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--ink-25);
          margin-bottom: .4rem;
          display: block;
        }
        .seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .35rem;
          margin-bottom: .8rem;
        }
        .seg-btn {
          padding: .5rem .4rem;
          border-radius: var(--r1);
          border: 1.5px solid var(--ink-10);
          background: rgba(255,255,255,0.4);
          cursor: pointer;
          font-family: var(--sans);
          font-size: .68rem;
          font-weight: 600;
          color: var(--ink-55);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .25rem;
          transition: all .16s;
        }
        .seg-btn:hover { border-color: var(--ink-25); }
        .seg-btn.on { border-color: var(--green); background: var(--green-l); color: var(--green); }
        .seg-btn.on.gold-on { border-color: var(--gold); background: var(--gold-l); color: var(--gold); }

        .tot-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .25rem; }
        .tot-lbl { font-size: .7rem; color: var(--ink-55); font-weight: 400; }
        .tot-v { font-size: .78rem; font-weight: 700; color: var(--ink); }
        .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: .35rem; }
        .total-lbl { font-family: var(--serif); font-style: italic; font-size: 1.1rem; font-weight: 600; color: var(--ink); }
        .total-v { font-size: 1.15rem; font-weight: 800; color: var(--green); letter-spacing: -.03em; }

        .cta {
          width: 100%;
          padding: .75rem;
          background: var(--green);
          color: var(--white);
          border: none;
          border-radius: var(--r4);
          font-family: var(--sans);
          font-size: .82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .18s var(--ease);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          margin-top: 1rem;
        }
        .cta:hover:not(:disabled) { background: var(--green-xd); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,94,56,.22); }
        .cta:disabled { opacity: .35; cursor: not-allowed; transform: none; }
        
        .cta-wa {
          width: 100%;
          padding: .65rem;
          background: rgba(37,211,102,.1);
          color: var(--wa);
          border: 1.5px solid rgba(37,211,102,.2);
          border-radius: var(--r4);
          font-family: var(--sans);
          font-size: .76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .16s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .35rem;
          margin-top: .45rem;
        }
        .cta-wa:hover { background: rgba(37,211,102,.18); }
        .wompi-line { display: flex; align-items: center; justify-content: center; gap: .3rem; margin-top: .6rem; font-size: .6rem; color: var(--ink-25); }
        .wompi-line span { background: rgba(95,53,205,.08); color: #5F35CD; padding: .1rem .4rem; border-radius: 3px; font-weight: 800; font-size: .58rem; }
      `}</style>

      <PaymentGatewayModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
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

      <aside className="cart">
        <div className="cart-top">
          <div className="cart-top-row">
            <div className="cart-title">Tu pedido</div>
            <div className="flex items-center gap-3">
              <div className={`cart-badge ${bumpBadge ? 'bump' : ''}`}>{totalQty}</div>
              {!isSidebar && (
                <button onClick={onClose} className="text-[10px] uppercase tracking-widest font-black text-amber-700/60 hover:text-amber-800 transition-colors ml-2">
                  Cerrar ✕
                </button>
              )}
            </div>
          </div>
          <input className="mini-field" type="text" placeholder="Nombre completo" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <input className="mini-field" type="tel" placeholder="WhatsApp · Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={{ marginBottom: 0 }} />
        </div>

        <div className="cart-scroll-area">
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-state">
                <div className="es-icon">🍽</div>
                <div className="es-txt">Elige un plato<br/>de la carta</div>
                <div className="es-sub">Añade lo que quieras</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.instanceId} className="ci">
                  <div className="ci-q">{item.qty}</div>
                  <div className="ci-name">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{item.name}</span>
                      <button onClick={() => setEditingItem(item)} className="text-[7.5px] uppercase tracking-[0.1em] font-black text-amber-700/70 hover:text-amber-800">
                        ✎
                      </button>
                    </div>
                    {item.customizations?.removed?.length > 0 && (
                      <div className="text-[8px] text-red-500 font-bold uppercase mt-0.5 opacity-80">
                        Sin: {item.customizations.removed.join(', ')}
                      </div>
                    )}
                    {item.customizations?.note && (
                      <div className="text-[8px] text-amber-800 italic mt-0.5 truncate max-w-[120px] opacity-80">
                        "{item.customizations.note}"
                      </div>
                    )}
                  </div>
                  <div className="ci-p">${((parsePrice(item.price) * item.qty) / 1000).toFixed(0)}k</div>
                  <button className="ci-rm" onClick={() => updateQty(item.instanceId, -item.qty)}>✕</button>
                </div>
              ))
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="rec-strip" style={{ marginTop: 'auto' }}>
              <div className="rec-lbl">✦ Combina perfecto con</div>
              <div className="rec-row">
                {recommendations.map(rec => (
                  <div key={rec.id} className="rec-item" onClick={() => addToCart(rec)}>
                    <div className="ri-img"><span className="text-sm">{rec.emoji || '🥤'}</span></div>
                    <div className="ri-info">
                      <div className="ri-name">{rec.name}</div>
                      <div className="ri-sub">${(rec.priceNum / 1000).toFixed(0)}k</div>
                    </div>
                    <div className="ri-add">+ Agregar</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cart-foot">
          <span className="field-label">¿Cómo recibes?</span>
          <div className="seg">
            <button className={`seg-btn ${delivery === 'pick' ? 'on' : ''}`} onClick={() => setDelivery('pick')}>🏃 Recoger</button>
            <button className={`seg-btn ${delivery === 'domicilio' ? 'on' : ''}`} onClick={() => setDelivery('domicilio')}>🛵 Domicilio</button>
          </div>
          
          {delivery === 'domicilio' && (
            <input className="mini-field" type="text" placeholder="Dirección exacta de entrega" value={address} onChange={e => setAddress(e.target.value)} style={{ marginTop: '-0.3rem', marginBottom: '0.8rem' }} />
          )}

          <span className="field-label">¿Cómo pagas?</span>
          <div className="seg" style={{ marginBottom: '1rem' }}>
            <button className={`seg-btn ${payment === 'efectivo' ? 'on' : ''}`} onClick={() => setPayment('efectivo')}>💵 Efectivo</button>
            <button className={`seg-btn ${payment === 'digital' ? 'on gold-on' : ''}`} onClick={() => setPayment('digital')}>💳 Wompi</button>
          </div>

          <div className="tot-row"><span className="tot-lbl">Subtotal</span><span className="tot-v">${(subtotal / 1000).toFixed(0)}k</span></div>
          {delivery === 'domicilio' && (
            <div className="tot-row"><span className="tot-lbl">Domicilio</span><span className="tot-v">$5k</span></div>
          )}
          <div className="total-row">
            <span className="total-lbl">Total</span>
            <span className="total-v">${(total / 1000).toFixed(0)}k</span>
          </div>

          <button className="cta" disabled={sending || cart.length === 0} onClick={handleFinish}>
            {sending ? <span className="animate-spin mr-2">⟳</span> : '✓ '}{sending ? 'Procesando...' : 'Confirmar pedido'}
          </button>
          <button className="cta-wa" onClick={askWa}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.26 8.26 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.835L0 24l6.341-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.813 9.813 0 01-4.984-1.361l-.357-.212-3.766.889.929-3.657-.232-.375A9.818 9.818 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182S21.818 6.568 21.818 12 17.432 21.818 12 21.818z"/></svg>
            Preguntar por WhatsApp
          </button>
          <div className="wompi-line">Pago seguro vía <span>Wompi</span> · Bancolombia</div>
        </div>
      </aside>
    </div>
  );
};
