import React, { createContext, useState, useContext, useCallback } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    // Haptic feedback nativo
    if (navigator.vibrate) navigator.vibrate(15);
  }, []);

  const removeOne = useCallback((id) => {
    setCart((prev) =>
      prev
        .map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /* Parsea "$32k" → 32000, "$180k" → 180000 */
  const parsePrice = (price) =>
    parseInt(price.replace('$', '').replace('k', '')) * 1000;

  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = cart.reduce((acc, i) => acc + parsePrice(i.price) * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeOne, clearCart, totalItems, totalPrice, total: totalPrice, parsePrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
