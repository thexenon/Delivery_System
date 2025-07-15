import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('cart');
      if (stored) setCart(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find(
        (p) =>
          p.product === item.product &&
          p.variety === item.variety &&
          JSON.stringify(p.options) === JSON.stringify(item.options)
      );
      if (exists) {
        return prev.map((p) =>
          p.product === item.product &&
          p.variety === item.variety &&
          JSON.stringify(p.options) === JSON.stringify(item.options)
            ? { ...p, quantity: (p.quantity || 1) + (item.quantity || 1) }
            : p
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const addOrUpdateCartItem = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.product === item.product);
      if (idx !== -1) {
        // Update
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...item };
        return updated;
      }
      // Add new
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addOrUpdateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
