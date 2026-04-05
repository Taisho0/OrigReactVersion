/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useContext } from 'react';
import { PRODUCTS } from '../data/products';
import { userAuth } from '../auth/AuthContext';

const StoreContext = createContext(undefined);

const CATALOG_STORAGE_KEY = 'theoriginals.catalog';
const ORDERS_STORAGE_KEY = 'theoriginals.orders';

const getCartItemKey = (productId, size) => `${productId}::${size || 'default'}`;

const createInitialCatalog = () => {
  if (typeof window === 'undefined') {
    return PRODUCTS.map((product) => ({ ...product, isArchived: false }));
  }

  try {
    const storedCatalog = window.localStorage.getItem(CATALOG_STORAGE_KEY);

    if (!storedCatalog) {
      return PRODUCTS.map((product) => ({ ...product, isArchived: false }));
    }

    const parsedCatalog = JSON.parse(storedCatalog);

    if (!Array.isArray(parsedCatalog)) {
      return PRODUCTS.map((product) => ({ ...product, isArchived: false }));
    }

    const storedById = new Map(parsedCatalog.filter((product) => product?.id).map((product) => [product.id, product]));
    const mergedCatalog = PRODUCTS.map((product) => {
      const storedProduct = storedById.get(product.id);

      if (!storedProduct) {
        return { ...product, isArchived: false };
      }

      return {
        ...product,
        ...storedProduct,
        id: product.id,
        isArchived: Boolean(storedProduct.isArchived),
      };
    });

    const archivedExtras = parsedCatalog.filter((product) => product?.id && !PRODUCTS.some((baseProduct) => baseProduct.id === product.id));

    return [...mergedCatalog, ...archivedExtras.map((product) => ({ ...product, isArchived: Boolean(product.isArchived) }))];
  } catch (error) {
    console.error('Unable to load catalog state:', error);
    return PRODUCTS.map((product) => ({ ...product, isArchived: false }));
  }
};

const createInitialOrders = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch (error) {
    console.error('Unable to load order history:', error);
    return [];
  }
};

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(createInitialOrders);
  const [catalog, setCatalog] = useState(createInitialCatalog);
  const { userProfile } = userAuth();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const activeProducts = catalog.filter((product) => !product.isArchived);
  const archivedProducts = catalog.filter((product) => product.isArchived);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => getCartItemKey(item.product.id, item.size) === getCartItemKey(product.id, product.selectedSize));
      if (existing) {
        return prev.map((item) =>
          getCartItemKey(item.product.id, item.size) === getCartItemKey(product.id, product.selectedSize)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size: product.selectedSize || product.size || product.variantSize || '' }];
    });
    return true;
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) => prev.filter((item) => getCartItemKey(item.product.id, item.size) !== getCartItemKey(productId, size)));
  };

  const updateQuantity = (productId, quantity, size) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        getCartItemKey(item.product.id, item.size) === getCartItemKey(productId, size)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const catalogTotalValue = activeProducts.reduce((sum, product) => sum + product.price, 0);

  const getProductById = (productId) =>
    catalog.find((product) => product.id === productId && !product.isArchived);

  const archiveProduct = (productId) => {
    setCatalog((previousCatalog) =>
      previousCatalog.map((product) =>
        product.id === productId ? { ...product, isArchived: true, archivedAt: new Date().toISOString() } : product
      )
    );
  };

  const updateProduct = (productId, updates) => {
    setCatalog((previousCatalog) =>
      previousCatalog.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...updates,
              price: typeof updates.price === 'string' ? Number(updates.price) : updates.price ?? product.price,
              sizes: Array.isArray(updates.sizes)
                ? updates.sizes
                : typeof updates.sizes === 'string'
                  ? updates.sizes.split(',').map((size) => size.trim()).filter(Boolean)
                  : product.sizes,
            }
          : product
      )
    );
  };

  const addProduct = (product) => {
    setCatalog((previousCatalog) => [
      ...previousCatalog,
      {
        ...product,
        id: product.id || `p-${Date.now()}`,
        isArchived: Boolean(product.isArchived),
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
      },
    ]);
  };

  const restoreProduct = (productId) => {
    setCatalog((previousCatalog) =>
      previousCatalog.map((product) =>
        product.id === productId ? { ...product, isArchived: false, archivedAt: undefined } : product
      )
    );
  };

  const placeOrder = () => {
    if (cart.length === 0) return '';
    
    const newOrder = {
      id: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      items: [...cart],
      total: cartTotal,
      status: 'Processing',
      date: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      purchaserRole: userProfile?.role || 'customer',
      purchaserEmail: userProfile?.email || '',
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
        catalog,
        activeProducts,
        archivedProducts,
        catalogTotalValue,
        getProductById,
        archiveProduct,
        restoreProduct,
        updateProduct,
        addProduct,
        getCartItemKey,
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
