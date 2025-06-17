
'use client'; 

import { useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation'; // Added useRouter
import { ClothingItemCard } from '@/components/clothing-item-card';
import { APP_NAME } from '@/lib/constants';
import type { ClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { HeartOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFavoritesStore } from '@/hooks/use-favorites-store';
import { useToast } from '@/hooks/use-toast';

export default function FavoritesPage() {
  const { favoriteItems, toggleFavorite, isInitialized: favoritesStoreInitialized } = useFavoritesStore();
  const { toast } = useToast();
  const router = useRouter(); // Initialized router

  useEffect(() => {
    if (favoritesStoreInitialized && favoriteItems.length === 0) {
      toast({
        title: 'თქვენი რჩეულების სია ცარიელია',
        description: 'გადამისამართება მთავარ გვერდზე...',
      });
      router.push('/');
    }
  }, [favoriteItems, favoritesStoreInitialized, router, toast]);

  const handleRemoveFromFavorites = (itemToRemove: ClothingItem) => {
    toggleFavorite(itemToRemove); 
    toast({
      title: `${itemToRemove.name} ამოღებულია რჩეულებიდან.`,
    });
  };

  if (!favoritesStoreInitialized || (favoritesStoreInitialized && favoriteItems.length === 0)) {
    return (
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary mb-2">თქვენი რჩეულები</h1>
          <p className="text-lg text-foreground/80">ნივთები, რომლებიც გიყვართ, ერთ ადგილას.</p>
        </header>
        <div className="flex justify-center items-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
            {favoriteItems.length === 0 && favoritesStoreInitialized ? 'რჩეულები ცარიელია, გადამისამართება...' : 'იტვირთება თქვენი რჩეული ნივთები...'}
        </div>
      </div>
    );
  }
  
  // This part will only be reached if favorites are initialized and not empty, 
  // or before the redirect effect kicks in.
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">თქვენი რჩეულები</h1>
        <p className="text-lg text-foreground/80">ნივთები, რომლებიც გიყვართ, ერთ ადგილას.</p>
      </header>

      {/* This grid will only render if items exist, otherwise the redirect logic above handles it */}
      {favoriteItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {favoriteItems.map((item) => (
            <div key={item.id} className="relative group">
              <ClothingItemCard item={item} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => handleRemoveFromFavorites(item)}
                aria-label={`${item.name}-ის რჩეულებიდან ამოღება`}
              >
                <HeartOff className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* 
        This block for empty favorites is effectively replaced by the redirect logic.
        However, keeping it (or a similar loader) might be useful if the redirect
        doesn't happen instantaneously or if there's a brief moment before it.
        For now, the loader + "redirecting..." message handles this.
      */}
      {/* 
      {favoriteItems.length === 0 && favoritesStoreInitialized && (
        // This will be handled by the redirect logic and loader above
      )} 
      */}
    </div>
  );
}

export function FavoritesPageMetadata() {
  return {
    title: 'თქვენი რჩეულები',
    description: `მართეთ თქვენი რჩეული ქართული ტანსაცმლის ნივთები ${APP_NAME}-ში.`,
  };
}
