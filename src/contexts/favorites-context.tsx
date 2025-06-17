
'use client';

import type { ClothingItem } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

const FAVORITES_STORAGE_KEY = 'tiflisi_favorites_store';

export interface FavoritesContextType {
  actualFavoriteItems: ClothingItem[];
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (item: ClothingItem) => void;
  getFavoriteCount: () => number;
  isStoreInitialized: boolean;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [currentFavoriteItems, setCurrentFavoriteItems] = useState<ClothingItem[]>([]);
  const [isProviderInitialized, setIsProviderInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client after hydration
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (storedFavorites) {
      try {
        setCurrentFavoriteItems(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites from localStorage", e);
        localStorage.removeItem(FAVORITES_STORAGE_KEY); // Clear corrupted data
      }
    }
    setIsProviderInitialized(true);
  }, []);

  useEffect(() => {
    if (isProviderInitialized) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(currentFavoriteItems));
    }
  }, [currentFavoriteItems, isProviderInitialized]);

  const isFavorite = useCallback((itemId: string): boolean => {
    return currentFavoriteItems.some(item => item.id === itemId);
  }, [currentFavoriteItems]);

  const toggleFavorite = useCallback((itemToToggle: ClothingItem) => {
    setCurrentFavoriteItems(prevItems => {
      const itemExists = prevItems.some(item => item.id === itemToToggle.id);
      if (itemExists) {
        return prevItems.filter(item => item.id !== itemToToggle.id);
      }
      return [...prevItems, itemToToggle];
    });
  }, []);

  const getFavoriteCount = useCallback((): number => {
    return currentFavoriteItems.length;
  }, [currentFavoriteItems]);
  
  const contextValue = {
    actualFavoriteItems: currentFavoriteItems,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    isStoreInitialized: isProviderInitialized,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}
