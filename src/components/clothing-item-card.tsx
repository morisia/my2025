
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ShoppingCart, Award, ArrowRight, Star, StarHalf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/hooks/use-favorites-store';
import { useCartStore } from '@/hooks/use-cart-store';

interface ClothingItemCardProps {
  item: ClothingItem;
}

export function ClothingItemCard({ item }: ClothingItemCardProps) {
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToCart } = useCartStore();

  const itemIsCurrentlyFavorite = isFavorite(item.id);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItemPayload = {
      ...item,
      imageUrl: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : 'https://placehold.co/100x133.png',
    };
    addToCart(cartItemPayload, 1, null, null);
    toast({
      title: `${item.name} დაემატა კალათაში!`,
      description: "განაგრძეთ შოპინგი ან გადადით გადახდაზე.",
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasFavorite = isFavorite(item.id);
    toggleFavorite(item); 
    
    if (wasFavorite) {
      toast({
        title: `${item.name} ამოღებულია რჩეულებიდან.`,
      });
    } else {
      toast({
        title: `${item.name} დაემატა რჩეულებში!`,
      });
    }
  };

  const originalPrice = item.price;
  let displayPrice = originalPrice.toFixed(2);
  let discountedPrice;

  if (item.discountPercentage && item.discountPercentage > 0) {
    discountedPrice = originalPrice - (originalPrice * item.discountPercentage) / 100;
    displayPrice = discountedPrice.toFixed(2);
  }

  const primaryImageUrl = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : 'https://placehold.co/500x700.png';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group">
      <CardHeader className="p-0 relative aspect-[7/6]">
        <Link href={`/catalog/${item.slug}`} aria-label={`დეტალების ნახვა ${item.name}-თვის`} className="block w-full h-full">
          <Image
            src={primaryImageUrl}
            alt={item.name}
            width={500}
            height={700}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={item.dataAiHint || "georgian clothing"}
          />
          {item.discountPercentage && item.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-md z-10">
              -{item.discountPercentage}%
            </div>
          )}
          {item.brandName && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 right-2 z-10 p-1 bg-background/70 rounded-full shadow cursor-default">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.brandName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="absolute bottom-2 right-2 z-20 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg border-border hover:border-primary"
              onClick={handleToggleFavorite}
              aria-label={itemIsCurrentlyFavorite ? `${item.name}-ის რჩეულებიდან ამოღება` : `${item.name}-ის რჩეულებში დამატება`}
            >
              <Heart className={cn("h-5 w-5", itemIsCurrentlyFavorite ? "fill-destructive text-destructive" : "text-foreground")} />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="bg-accent hover:bg-accent/80 text-accent-foreground rounded-full shadow-lg"
              onClick={handleAddToCart}
              aria-label={`${item.name}-ის კალათაში დამატება`}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <div> 
          <Link href={`/catalog/${item.slug}`} aria-label={`დეტალების ნახვა ${item.name}-თვის`}>
            <CardTitle className="font-headline text-base leading-tight mb-1 hover:text-primary transition-colors">
              {item.name}
            </CardTitle>
          </Link>
          {item.averageRating !== undefined && typeof item.averageRating === 'number' && item.reviewCount !== undefined && typeof item.reviewCount === 'number' && item.reviewCount > 0 && (
            <div className="flex items-center gap-0.5 mb-1.5">
              {Array.from({ length: 5 }, (_, i) => {
                const ratingValue = item.averageRating!; // Use non-null assertion as we check above
                if (ratingValue >= i + 1) {
                  return <Star key={`card-star-${item.id}-${i}`} className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
                } else if (ratingValue >= i + 0.5) {
                  return <StarHalf key={`card-star-${item.id}-${i}`} className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
                } else {
                  return <Star key={`card-star-${item.id}-${i}`} className="h-4 w-4 text-muted-foreground opacity-70" />;
                }
              })}
              <span className="text-xs text-muted-foreground ml-1">({item.reviewCount})</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-1">ზომა: {item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'N/A'}</p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto pt-1"> 
          <div className="flex items-baseline gap-2">
            <p className="font-semibold text-foreground text-base">L{displayPrice}</p>
            {discountedPrice && (
              <p className="text-sm text-muted-foreground line-through">L{originalPrice.toFixed(2)}</p>
            )}
          </div>
          <Link href={`/catalog/${item.slug}`} aria-label={`დეტალების ნახვა ${item.name}-თვის`} className="text-primary hover:text-primary/80 transition-colors">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
