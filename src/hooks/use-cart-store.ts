
'use client';

import { useContext } from 'react';
import { CartContext, type CartContextType } from '@/contexts/cart-context';
import type { ClothingItem } from '@/lib/types'; // Ensure ClothingItem is imported if used in return type (not directly here but good practice)

// Updated to reflect the new signature of addToCart
export interface CartStoreHookType extends Omit<CartContextType, 'addToCart'> {
  addToCart: (item: ClothingItem, quantity: number, selectedSize: string | null, selectedColor: string | null) => void;
}

export function useCartStore(): CartStoreHookType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartStore must be used within a CartProvider');
  }
  return context as CartStoreHookType; // Cast as the new type, ensuring addToCart matches
}
