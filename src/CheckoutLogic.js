const WA_NUMBER = '573001234567'; // ← reemplazar con el número real del restaurante

/**
 * Formatea el pedido completo en un mensaje estructurado para WhatsApp.
 * @param {Array}  cart      - Items del carrito [{ name, price, qty, emoji }]
 * @param {number} total     - Total en pesos (ej: 64000)
 * @param {string} delivery  - 'mesa' | 'recoger' | 'domicilio'
 * @param {string} payment   - 'efectivo' | 'transferencia'
 * @param {string} [extra]   - Número de mesa o dirección de domicilio
 * @param {boolean} [hasReceipt] - true si el cliente adjuntó comprobante
 */
export const formatWhatsAppMessage = (
  cart,
  total,
  delivery,
  payment,
  extra = '',
  hasReceipt = false,
) => {
  const DELIVERY_LABELS = {
    mesa:      '🪑 En Mesa',
    recoger:   '🏃 Para Recoger',
    domicilio: '🛵 Domicilio',
  };

  const PAYMENT_LABELS = {
    efectivo:      '💵 Efectivo',
    transferencia: '📲 Transferencia',
  };

  const itemsList = cart
    .map(item => `  • ${item.emoji ?? ''} ${item.name} ×${item.qty} — ${item.price}`)
    .join('\n');

  const extraLine = extra
    ? `\n*${delivery === 'mesa' ? 'Mesa N°' : 'Dirección'}:* ${extra}`
    : '';

  const paymentStatus =
    payment === 'transferencia'
      ? hasReceipt
        ? '✅ Comprobante adjunto'
        : '⚠️ Comprobante pendiente'
      : '⏳ Pago en efectivo al recibir';

  return (
    `*🍽️ NUEVO PEDIDO — LA RIVERA TECH GASTRO*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*PRODUCTOS:*\n${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Subtotal:* $${(total / 1000).toFixed(0)}k\n` +
    `*Entrega:* ${DELIVERY_LABELS[delivery] ?? delivery}${extraLine}\n` +
    `*Pago:*  ${PAYMENT_LABELS[payment] ?? payment}\n` +
    `*Estado:* ${paymentStatus}`
  );
};

/** Abre WhatsApp con el mensaje ya codificado */
export const sendToWhatsApp = (message) => {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
