import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CartFooter = ({ cartItems }) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + ((item.numericPrice || 0) * item.quantity), 0);
  const formattedTotal = `$${totalPrice / 1000}K`;

  const handleCheckout = () => {
    const phone = "573000000000"; // Reemplazar con número real

    let message = "¡Hola! 🐾 Quiero pedir de *Más Perrón*:\n\n";
    cartItems.forEach(item => {
      message += `• ${item.quantity}x ${item.name} ($${(item.numericPrice * item.quantity) / 1000}K)\n`;
    });
    message += `\n💰 *Total: ${formattedTotal}*\n\n¡Gracias! ❤️`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <AnimatePresence>
      {cartItems.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          className="fixed bottom-14 left-0 right-0 z-30 px-4 pb-2 pt-6"
          style={{ background: 'linear-gradient(to top, rgba(62,31,13,0.95) 30%, transparent)' }}
        >
          <div className="max-w-md mx-auto">
            <button
              onClick={handleCheckout}
              className="w-full bg-[#25D366] text-white font-black uppercase tracking-[0.12em] py-4 px-5 rounded-2xl flex justify-between items-center active:scale-[0.97] transition-all text-[14px]"
              style={{ boxShadow: '0 6px 24px rgba(37,211,102,0.35)' }}
            >
              <div className="flex items-center gap-3">
                <span className="bg-white/20 backdrop-blur-sm w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">
                  {totalItems}
                </span>
                <span>Pedir por WhatsApp</span>
              </div>
              <span className="text-base font-black">{formattedTotal}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
