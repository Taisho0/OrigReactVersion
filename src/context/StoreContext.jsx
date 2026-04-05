import { createContext, useContext, useState } from 'react';
import { userAuth } from '../auth/AuthContext';

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const { session } = userAuth();

  const addToCart = (product) => {
    if (!session) {
      return false; // User not signed in
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    return true;
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const placeOrder = () => {
    if (cart.length === 0) return '';
    
    const newOrder = {
      id: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      items: [...cart],
      total: cartTotal,
      status: 'Processing',
      date: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    
    // Simulate order progression
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'Shipped' } : o));
    }, 15000);
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'Out for Delivery' } : o));
    }, 30000);
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'Delivered' } : o));
    }, 45000);

    return newOrder.id;
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        orders,
        placeOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
