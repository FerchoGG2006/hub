import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../shared/hooks/useCart';
import { useParams } from 'react-router-dom';
import { PaymentGatewayModal } from '../tenants/components/PaymentGatewayModal';
import { ProductCustomizer } from './ProductCustomizer';
import { MENU_DATA } from './MenuData';

export const CheckoutPanel = ({ onClose, isSidebar = false }) => {
  const { tenantSlug } = useParams();
  const { cart, totalPrice, clearCart, parsePrice, updateQty, updateCustomization, addToCart } = useCart();

  // Detect mesa from URL
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
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Dynamic Cross-Selling Recommendations
  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];
    // Get list of drink/liqueur IDs from MENU_DATA "Licores"
    const licores = MENU_DATA["Licores"] || [];
    const cartIds = new Set(cart.map(item => item.id));
    
    // Recommend up to 2 drinks/liqueurs that are not already in the cart
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
          // Open digital payment gateway modal
          setActiveOrderId(orderId);
          setShowPaymentModal(true);
        } else {
          // Cash order - redirect to WhatsApp with order summary
          const lines = cart.map(i => `  ${i.qty}x ${i.name} — $${(parsePrice(i.price) * i.qty / 1000).toFixed(0)}k`).join('\n');
          const totalStr = `$${((totalPrice + (delivery === 'domicilio' ? 5000 : 0)) / 1000).toFixed(0)}k`;
          const msg = `¡Hola! Quiero hacer un pedido en ${tenantSlug.toUpperCase()} 🍽️\n\n*Nombre:* ${customerName}\n*Tel:* ${phone}\n*Tipo:* ${delivery === 'domicilio' ? 'Domicilio' : 'Recoger en sitio'}\n*Pago:* Efectivo\n\n*Pedido:*\n${lines}\n\n*Total: ${totalStr}*\n\nPedido generado por Platorin ✅`;
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
    const msg = `Hola, tengo una pregunta sobre el menú de ${tenantSlug.toUpperCase()} 🍽️`;
    window.open(`https://wa.me/573001234567?text=${encodeURIComponent(msg)}`, '_blank');
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
        style={{ background: '#FDFAF5', backdropFilter: 'blur(24px)' }}
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
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="cart-panel-scope h-full w-full">
      {/* Scope encapsulated Styles */}
      <style>{`
        .cart-panel-scope {
          --bg:        #F2EDE4;
          --surface:   #FDFAF5;
          --surface-2: #F7F2E9;
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
          --gold-l:    #FBF3E2;
          --red:       #C0392B;
          --white:     #FFFFFF;
          --r1: 8px; --r2: 14px; --r3: 20px; --r4: 28px;
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans:  'Plus Jakarta Sans', system-ui, sans-serif;
        }

        .cart-container {
          background: var(--surface);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          font-family: var(--sans);
          color: var(--ink);
        }

        .cart-top {
          padding: 1.25rem 1.25rem 0.9rem;
          border-bottom: 1px solid var(--ink-10);
          flex-shrink: 0;
          background: var(--surface);
          z-index: 10;
        }
        .cart-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cart-title {
          font-family: var(--serif);
          font-style: italic;
          font-weight: 700;
          font-size: 1.35rem;
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
        }

        .cart-scrollable-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          scrollbar-width: none;
          WebkitOverflowScrolling: touch;
        }
        .cart-scrollable-body::-webkit-scrollbar { display: none; }

        .cart-section-title {
          font-size: .62rem;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--ink-25);
          margin-bottom: 0.6rem;
          display: block;
        }

        .mini-field {
          width: 100%;
          padding: 0.55rem 0.75rem;
          border: 1.5px solid var(--ink-10);
          border-radius: var(--r1);
          font-size: .76rem;
          font-family: var(--sans);
          color: var(--ink);
          background: var(--white);
          outline: none;
          transition: border .2s;
          margin-bottom: 0.5rem;
        }
        .mini-field:focus { border-color: var(--green); }
        .mini-field::placeholder { color: var(--ink-25); }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          padding: 2rem 1rem;
          text-align: center;
        }
        .es-icon { font-size: 2.2rem; opacity: .2; }
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
          width: 18px;
          height: 18px;
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
        .ci-rm:hover {
          background: rgba(192,57,43,.08);
          color: var(--red);
        }

        .rec-strip {
          padding: 0.75rem .85rem;
          border-radius: var(--r2);
          background: var(--surface-2);
          border: 1px solid var(--ink-05);
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
          gap: .4rem;
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
          background: var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ri-info {
          flex: 1;
          min-width: 0;
        }
        .ri-name {
          font-size: .68rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.2;
          truncate: true;
        }
        .ri-sub {
          font-size: .58rem;
          color: var(--ink-55);
          font-weight: 300;
        }
        .ri-p {
          font-size: .68rem;
          font-weight: 800;
          color: var(--gold);
          flex-shrink: 0;
        }
        .ri-add {
          font-size: .6rem;
          font-weight: 700;
          color: var(--green);
          flex-shrink: 0;
        }

        .field-label {
          font-size: .58rem;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--ink-25);
          margin-bottom: .35rem;
          display: block;
        }
        .seg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .35rem;
          margin-bottom: 0.6rem;
        }
        .seg-btn {
          padding: .5rem .4rem;
          border-radius: var(--r1);
          border: 1.5px solid var(--ink-10);
          background: none;
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
        .seg-btn.on {
          border-color: var(--green);
          background: var(--green-l);
          color: var(--green);
        }
        .seg-btn.on.gold-on {
          border-color: var(--gold);
          background: var(--gold-l);
          color: var(--gold);
        }

        .cart-foot-sticky {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--ink-10);
          background: var(--surface);
          flex-shrink: 0;
          box-shadow: 0 -6px 24px rgba(0,0,0,0.03);
          z-index: 10;
        }

        .tot-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: .25rem;
        }
        .tot-lbl { font-size: .7rem; color: var(--ink-55); font-weight: 400; }
        .tot-v { font-size: .78rem; font-weight: 700; color: var(--ink); }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-top: .35rem;
          padding-top: 0.2rem;
          border-top: 1px dashed var(--ink-10);
        }
        .total-lbl {
          font-family: var(--serif);
          font-style: italic;
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
        }
        .total-v {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--green);
          letter-spacing: -.03em;
        }

        .cta {
          width: 100%;
          padding: .7rem;
          background: var(--green);
          color: var(--white);
          border: none;
          border-radius: var(--r4);
          font-family: var(--sans);
          font-size: .82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
          margin-top: .65rem;
        }
        .cta:hover:not(:disabled) {
          background: var(--green-xd);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(27,94,56,.22);
        }
        .cta:disabled { opacity: .35; cursor: not-allowed; }

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
          margin-top: .4rem;
        }
        .cta-wa:hover { background: rgba(37,211,102,.18); }

        .wompi-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .3rem;
          margin-top: 0.6rem;
          font-size: .6rem;
          color: var(--ink-25);
        }
        .wompi-line span {
          background: rgba(95,53,205,.08);
          color: #5F35CD;
          padding: .1rem .4rem;
          border-radius: 3px;
          font-weight: 800;
          font-size: .58rem;
        }
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

      {/* Main Cart Structure */}
      <aside className="cart-container">
        
        {/* Cart Top / Sticky Header */}
        <div className="cart-top">
          <div className="cart-top-row">
            <div className="flex items-center gap-3">
              <div className="cart-title">Tu pedido</div>
              <div className="cart-badge">{totalQty}</div>
            </div>
            
            {/* Close button for Mobile drawers */}
            {!isSidebar && (
              <button 
                onClick={onClose} 
                className="text-xs uppercase tracking-widest font-black text-amber-700 hover:text-amber-800"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cerrar ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Form & Items Container */}
        <div className="cart-scrollable-body">
          
          {/* 1. Datos de Entrega */}
          <div className="cart-delivery-info">
            <span className="cart-section-title">Datos del Cliente</span>
            <input 
              className="mini-field" 
              type="text" 
              placeholder="Nombre completo"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <input 
              className="mini-field" 
              type="tel" 
              placeholder="WhatsApp · Teléfono"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          {/* 2. Platos Seleccionados */}
          <div className="cart-products-section">
            <span className="cart-section-title">Productos Seleccionados</span>
            <div className="cart-products-list">
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
                    <div className="ci-name flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[13px] text-[#1a1008]">{item.name}</span>
                        <button 
                          onClick={() => setEditingItem(item)}
                          className="text-[8px] uppercase tracking-[0.1em] font-black text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-0.5"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                      {item.customizations?.removed?.length > 0 && (
                        <span className="text-[8px] text-red-500 font-bold uppercase mt-0.5">
                          Sin: {item.customizations.removed.join(', ')}
                        </span>
                      )}
                      {item.customizations?.note && (
                        <span className="text-[8px] text-amber-800 italic mt-0.5 truncate max-w-[120px]">
                          "{item.customizations.note}"
                        </span>
                      )}
                    </div>
                    <div className="ci-p">
                      ${((parsePrice(item.price) * item.qty) / 1000).toFixed(0)}k
                    </div>
                    <button 
                      className="ci-rm"
                      onClick={() => updateQty(item.instanceId, -item.qty)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Recomendaciones de Venta Cruzada */}
          {recommendations.length > 0 && (
            <div className="rec-strip">
              <div className="rec-lbl">✦ Combina perfecto con</div>
              <div className="rec-row">
                {recommendations.map(rec => (
                  <div 
                    key={rec.id} 
                    className="rec-item"
                    onClick={() => addToCart(rec)}
                  >
                    <div className="ri-img">
                      <span className="text-sm">{rec.emoji || '🥤'}</span>
                    </div>
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

          {/* 4. Preferencias de Entrega y Pago */}
          <div className="cart-preferences-section">
            <span className="field-label">¿Cómo recibes?</span>
            <div className="seg">
              <button 
                className={`seg-btn ${delivery === 'pick' ? 'on' : ''}`}
                onClick={() => setDelivery('pick')}
              >
                🏃 Recoger
              </button>
              <button 
                className={`seg-btn ${delivery === 'domicilio' ? 'on' : ''}`}
                onClick={() => setDelivery('domicilio')}
              >
                🛵 Domicilio
              </button>
            </div>

            {delivery === 'domicilio' && (
              <input 
                className="mini-field mt-1" 
                type="text" 
                placeholder="Dirección exacta de entrega"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            )}

            <span className="field-label">¿Cómo pagas?</span>
            <div className="seg">
              <button 
                className={`seg-btn ${payment === 'efectivo' ? 'on' : ''}`}
                onClick={() => setPayment('efectivo')}
              >
                💵 Efectivo
              </button>
              <button 
                className={`seg-btn ${payment === 'digital' ? 'on gold-on' : ''}`}
                onClick={() => setPayment('digital')}
              >
                💳 Wompi
              </button>
            </div>
          </div>

          {/* 5. Soporte y Notas de Pago */}
          <div className="cart-support-section">
            <button className="cta-wa" onClick={askWa}>
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" className="mr-1 inline-block">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.26 8.26 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.835L0 24l6.341-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.813 9.813 0 01-4.984-1.361l-.357-.212-3.766.889.929-3.657-.232-.375A9.818 9.818 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182S21.818 6.568 21.818 12 17.432 21.818 12 21.818z"/>
              </svg>
              Preguntar por WhatsApp
            </button>
            <div className="wompi-line">Pago seguro vía <span>Wompi</span> · Bancolombia</div>
          </div>

        </div>

        {/* Cart Foot / Sticky Totals & CTA */}
        <div className="cart-foot-sticky">
          <div className="tot-row">
            <span className="tot-lbl">Subtotal</span>
            <span className="tot-v">${(subtotal / 1000).toFixed(0)}k</span>
          </div>
          {delivery === 'domicilio' && (
            <div className="tot-row">
              <span className="tot-lbl">Domicilio</span>
              <span className="tot-v">$5k</span>
            </div>
          )}
          
          <div className="total-row">
            <span className="total-lbl">Total</span>
            <span className="total-v">${(total / 1000).toFixed(0)}k</span>
          </div>

          <button 
            className="cta" 
            disabled={sending || cart.length === 0}
            onClick={handleFinish}
          >
            {sending ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⟳</span>
                Procesando...
              </span>
            ) : (
              `✓ Confirmar pedido`
            )}
          </button>
        </div>

      </aside>
    </div>
  );
};
