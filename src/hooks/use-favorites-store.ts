
'use client';
import { useContext } from 'react';
import { FavoritesContext } from '@/contexts/favorites-context'; // Ensure this path is correct
import type { ClothingItem } from '@/lib/types';
import type { FavoritesContextType as InternalContextType } from '@/contexts/favorites-context';


export interface FavoritesStoreHookType {
  favoriteItems: ClothingItem[];
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (item: ClothingItem) => void;
  getFavoriteCount: () => number;
  isInitialized: boolean; 
}

export function useFavoritesStore(): FavoritesStoreHookType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesStore must be used within a FavoritesProvider');
  }
  
  return {
    favoriteItems: context.isStoreInitialized ? context.actualFavoriteItems : [],
    isFavorite: context.isFavorite,
    toggleFavorite: context.toggleFavorite,
    getFavoriteCount: context.getFavoriteCount,
    isInitialized: context.isStoreInitialized,
  };
}
