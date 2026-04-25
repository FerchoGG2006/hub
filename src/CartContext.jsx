import React, { createContext, useState, useCallback } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const instanceId = `${product.id}-${Date.now()}`;
      return [...prev, { 
        ...product, 
        instanceId, 
        qty: 1,
        customizations: {
          removed: [],
          note: ""
        },
        baseIngredients: product.baseIngredients || ["Sal", "Pimienta"]
      }];
    });
    if (navigator.vibrate) navigator.vibrate(15);
  }, []);

  const updateCustomization = useCallback((instanceId, customizations) => {
    setCart((prev) => prev.map(i => 
      i.instanceId === instanceId ? { ...i, customizations } : i
    ));
  }, []);

  const removeOne = useCallback((instanceId) => {
    setCart((prev) => prev.filter(i => i.instanceId !== instanceId));
  }, []);

  const updateQty = useCallback((instanceId, delta) => {
    setCart((prev) => prev.map(i => 
      i.instanceId === instanceId ? { ...i, qty: Math.max(0, i.qty + delta) } : i
    ).filter(i => i.qty > 0));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const parsePrice = (price) => {
    if (!price) return 0;
    const str = price.toString().toLowerCase().replace('$', '');
    if (str.includes('k')) {
      return parseInt(str.replace('k', '').replace('.', '')) * 1000;
    }
    return parseInt(str.replace(/\./g, ''));
  };

  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
  const totalPrice = cart.reduce((acc, i) => acc + parsePrice(i.price) * i.qty, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQty, 
      removeOne, 
      updateCustomization,
      clearCart, 
      totalItems, 
      totalPrice, 
      total: totalPrice, 
      parsePrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};
