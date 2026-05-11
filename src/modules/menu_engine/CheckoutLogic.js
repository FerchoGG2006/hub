// Eliminamos constante dura
// Los valores ahora se pasan dinámicamente desde la vista
/**
 * @param {Array}  cart     - Items [{name, price, qty, emoji}]
 * @param {number} total    - Total en pesos (ej: 64000)
 * @param {string} delivery - 'mesa' | 'recoger' | 'domicilio'
 * @param {string} payment  - 'efectivo' | 'transferencia'
 * @param {string} tenantName - Nombre de la franquicia
 * @param {string} [phone]  - Opcional, número del cliente
 */
export const formatWhatsAppMessage = (cart, total, delivery, payment, tenantName, phone) => {
  const itemsList = cart
    .map(item => `• ${item.name}${item.qty > 1 ? ` x${item.qty}` : ''} | ${item.price}`)
    .join('\n');

  return `*NUEVO PEDIDO - ${tenantName?.toUpperCase() || 'HUB'}* 🍽️
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
export const sendToWhatsApp = (waNumber, message) => {
  const number = waNumber || '573000000000';
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
};
