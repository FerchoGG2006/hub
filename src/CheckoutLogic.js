const WA_NUMBER = '573001234567'; // ← reemplaza con el número real del restaurante

/**
 * @param {Array}  cart     - Items [{name, price, qty, emoji}]
 * @param {number} total    - Total en pesos (ej: 64000)
 * @param {string} delivery - 'mesa' | 'recoger' | 'domicilio'
 * @param {string} payment  - 'efectivo' | 'transferencia'
 * @param {string} [phone]  - Opcional, número del cliente
 */
export const formatWhatsAppMessage = (cart, total, delivery, payment, phone) => {
  const itemsList = cart
    .map(item => `• ${item.name}${item.qty > 1 ? ` x${item.qty}` : ''} | ${item.price}`)
    .join('\n');

  return `*NUEVO PEDIDO - HUB CARTA DIGITAL* 🍽️
--------------------------------
*PRODUCTOS:*
${itemsList}

*RESUMEN:*
- Subtotal: $${(total / 1000).toFixed(0)}k
- Entrega: ${delivery.toUpperCase()}
- Pago: ${payment.toUpperCase()}
${phone ? `- Teléfono: ${phone}` : ''}
--------------------------------
*ESTADO:* ${payment === 'transferencia' ? '✅ Comprobante Adjunto' : '⏳ Pago en Efectivo'}
`;
};

/** Abre WhatsApp con el mensaje codificado */
export const sendToWhatsApp = (message) => {
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
};
