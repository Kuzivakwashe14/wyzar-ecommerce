// In frontend/context/CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/components/ProductCard'; // Reuse our Product type
import { toast } from "sonner"

// 1. Define the shape of a cart item
export interface CartItem extends Product {
  cartQuantity: number;
}

// 2. Define the shape of the context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

// 3. Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Create the CartProvider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 5. Load cart from localStorage on app start
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // 6. Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // 7. Add to Cart function
  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);

      if (existingItem) {
        // If item exists, check against stock
        const newQuantity = existingItem.cartQuantity + 1;
        if (newQuantity > product.quantity) {
          toast(
            "Stock Limit Reached",{
            description: `You cannot add more than ${product.quantity} of this item.`,
          });
          return prevItems;
        }
        // Update quantity
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, cartQuantity: newQuantity }
            : item
        );
      } else {
        // If new item, check stock
        if (1 > product.quantity) {
          toast(
            "Out of Stock",{
            description: "This item is currently out of stock.",
          });
          return prevItems;
        }
        // Add new item to cart
        return [...prevItems, { ...product, cartQuantity: 1 }];
      }
    });
    toast(
      "Added to Cart!",{
      description: `${product.name} was added to your cart.`,
    });
  };

  // 8. Remove from Cart function
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    toast(
      "Item Removed",{
      description: "The item was removed from your cart.",
    });
  };

  // 9. Update Quantity function
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item._id === productId) {
          // Check stock
          if (newQuantity > item.quantity) {
            toast(
              "Stock Limit Reached",{
              description: `Only ${item.quantity} of this item are available.`,
            });
            return { ...item, cartQuantity: item.quantity }; // Set to max
          }
          return { ...item, cartQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  // 10. Clear Cart function
  const clearCart = () => {
    setCartItems([]);
    toast(
      "Cart Cleared",{
    });
  };

  // 11. Calculate total items and price
  const itemCount = cartItems.reduce((total, item) => total + item.cartQuantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.cartQuantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

// 12. Create a custom hook for easy access
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};