
'use client';

import type { ClothingItem, CartItem as CartItemType } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

const CART_STORAGE_KEY = 'tiflisi_cart';

export interface CartContextType {
  cartItems: CartItemType[];
  addToCart: (item: ClothingItem, quantity: number, selectedSize: string | null, selectedColor: string | null) => void;
  removeFromCart: (cartItemId: string) => string | undefined; // Returns name of removed item for toast
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getTotalItemCount: () => number;
  isCartInitialized: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartInitialized, setIsCartInitialized] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsCartInitialized(true);
  }, []);

  useEffect(() => {
    if (isCartInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isCartInitialized]);

  const generateCartItemId = (productId: string, size: string | null, color: string | null): string => {
    return `${productId}-${size || 'no-size'}-${color || 'no-color'}`;
  };

  const addToCart = useCallback((itemToAdd: ClothingItem, quantity: number = 1, selectedSize: string | null, selectedColor: string | null) => {
    const cartItemId = generateCartItemId(itemToAdd.id, selectedSize, selectedColor);
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === cartItemId);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      const newCartItem: CartItemType = {
        id: cartItemId,
        productId: itemToAdd.id,
        name: itemToAdd.name,
        price: itemToAdd.price, // Assuming price doesn't change with variant for now
        imageUrl: (itemToAdd.imageUrls && itemToAdd.imageUrls.length > 0) ? itemToAdd.imageUrls[0] : 'https://placehold.co/100x133.png',
        slug: itemToAdd.slug,
        quantity: quantity,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        dataAiHint: itemToAdd.dataAiHint,
        availableSizes: itemToAdd.sizes || [],
        availableColors: itemToAdd.colors || [],
      };
      return [...prevItems, newCartItem];
    });
  }, []);

  const removeFromCart = useCallback((cartItemIdToRemove: string): string | undefined => {
    const itemToRemoveDetails = cartItems.find(item => item.id === cartItemIdToRemove);
    const removedItemName = itemToRemoveDetails ? itemToRemoveDetails.name : undefined;
    setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemIdToRemove));
    return removedItemName;
  }, [cartItems]);

  const updateQuantity = useCallback((cartItemIdToUpdate: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemIdToUpdate));
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === cartItemIdToUpdate ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartSubtotal = useCallback((): number => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const getTotalItemCount = useCallback((): number => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartSubtotal,
    getTotalItemCount,
    isCartInitialized,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
