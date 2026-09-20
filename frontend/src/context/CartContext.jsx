import { createContext, useContext, useState, useEffect } from 'react';
import { getProductImage } from '../utils/productImages';

const CartContext = createContext(null);

const STORAGE_KEY = 'rudra_cart';
const LEGACY_STORAGE_KEY = 'rudra_online_store_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
    }
    return [];
  });

  // Persist cart to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems]);

  /**
   * Add a product variant to cart.
   * If same product + same variant already exists, increments quantity.
   * Different variants remain separate items.
   */
  const addToCart = (product, variant, quantity = 1) => {
    if (!product) return;

    const variantKey = variant?.variantId || variant?.weight || 'standard';
    const itemId = `${product.id}_${variantKey}`;
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === itemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentQty = updated[existingIndex].quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(currentQty + qtyToAdd, 99),
        };
        return updated;
      }

      const validPrice =
        typeof variant?.price === 'number' && variant.price > 0
          ? variant.price
          : null;

      const newItem = {
        id: itemId,
        productId: product.id,
        productName: product.name,
        name: product.name,
        variantId: variant?.variantId || null,
        weight: variant?.weight || '',
        image: getProductImage(product),
        quantity: Math.min(qtyToAdd, 99),
        price: validPrice,
      };

      return [...prevItems, newItem];
    });
  };

  /**
   * Update item quantity.
   * Quantity must never become less than 1.
   */
  const updateQuantity = (itemId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(qty, 99) } : item
      )
    );
  };

  /**
   * Remove item from cart by itemId.
   */
  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  /**
   * Clear all items from cart.
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Total quantity of all products in the cart (e.g. 2 of 250g + 1 of 500g = 3)
  const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Checks if any item has unconfigured or null pricing
  const hasUnpricedItems = cartItems.some(
    (item) => typeof item.price !== 'number' || item.price <= 0
  );

  // Subtotal calculated strictly for priced items
  const subtotal = cartItems.reduce((sum, item) => {
    if (typeof item.price === 'number' && item.price > 0) {
      return sum + item.price * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalQuantity,
    hasUnpricedItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
