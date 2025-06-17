
'use client';

import { useState, useEffect, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import type { ClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/hooks/use-cart-store';
import { useFavoritesStore } from '@/hooks/use-favorites-store';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Heart, ChevronLeft, Star, StarHalf, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

interface ProductViewProps {
  product: ClothingItem;
}

export default function ProductView({ product }: ProductViewProps) {
  const { toast } = useToast();
  const { addToCart } = useCartStore();
  const { favoriteItems, toggleFavorite, isFavorite, isInitialized: favoritesInitialized } = useFavoritesStore();

  const [selectedImage, setSelectedImage] = useState<string>(
    () => (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/600x800.png')
  );
  const [isCurrentlyFavorite, setIsCurrentlyFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser && product.id) {
      const fetchUserRating = async () => {
        setIsRatingLoading(true);
        try {
          const ratingDocRef = doc(db, "userProductRatings", `${firebaseUser.uid}_${product.id}`);
          const docSnap = await getDoc(ratingDocRef);
          if (docSnap.exists()) {
            setUserRating(docSnap.data().rating as number);
          } else {
            setUserRating(null);
          }
        } catch (error) {
          console.error("Error fetching user rating:", error);
          setUserRating(null);
        } finally {
          setIsRatingLoading(false);
        }
      };
      fetchUserRating();
    } else {
      setUserRating(null); // Reset if user logs out or product changes
    }
  }, [firebaseUser, product.id]);

  useEffect(() => {
    const newInitialImage = (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls[0]
      : 'https://placehold.co/600x800.png';
    
    if (product.imageUrls && product.imageUrls.length > 0) {
        if (!product.imageUrls.includes(selectedImage) || selectedImage === 'https://placehold.co/600x800.png') {
            setSelectedImage(product.imageUrls[0]);
        }
    } else {
        setSelectedImage('https://placehold.co/600x800.png');
    }
  }, [product.id, product.imageUrls, selectedImage]);

  useEffect(() => {
    if (favoritesInitialized) {
      setIsCurrentlyFavorite(isFavorite(product.id));
    }
  }, [favoritesInitialized, product.id, isFavorite, favoriteItems]);

  useEffect(() => {
    if (product.sizes && product.sizes.length === 1 && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
    if (product.colors && product.colors.length === 1 && !selectedColor) {
      setSelectedColor(product.colors[0]);
    }
  }, [product.sizes, product.colors, selectedSize, selectedColor]);

  const needsSizeSelection = product.sizes && product.sizes.length > 0;
  const needsColorSelection = product.colors && product.colors.length > 0;

  const sizeRequirementMet = !needsSizeSelection || (needsSizeSelection && !!selectedSize);
  const colorRequirementMet = !needsColorSelection || (needsColorSelection && !!selectedColor);
  const canAddToCart = sizeRequirementMet && colorRequirementMet;

  const handleAddToCart = () => {
    if (!canAddToCart) {
      toast({
        title: "გთხოვთ, აირჩიოთ ზომა და ფერი",
        description: "სანამ კალათაში დაამატებთ, საჭიროა ყველა ვარიანტის არჩევა.",
        variant: "destructive",
      });
      return;
    }

    const cartItemProductDetails: ClothingItem = { ...product };
    addToCart(cartItemProductDetails, 1, selectedSize, selectedColor);
    toast({
      title: `${product.name} დაემატა კალათაში!`,
      description: 'შეგიძლიათ გააგრძელოთ შოპინგი ან გადახვიდეთ გადახდაზე.',
    });
  };

  const handleToggleFavorite = () => {
    if (!favoritesInitialized) return;
    const isNowFavorite = !isFavorite(product.id);
    toggleFavorite(product);
    toast({ title: `${product.name} ${isNowFavorite ? 'დაემატა' : 'ამოღებულია'} რჩეულებში!` });
  };
  
  const handleSetRating = async (ratingValue: number) => {
    if (!firebaseUser) {
      toast({ title: "შეცდომა", description: "რეიტინგის დასაფიქსირებლად გთხოვთ, გაიაროთ ავტორიზაცია.", variant: "destructive" });
      return;
    }
    setIsRatingLoading(true);
    try {
      const ratingDocRef = doc(db, "userProductRatings", `${firebaseUser.uid}_${product.id}`);
      await setDoc(ratingDocRef, {
        userId: firebaseUser.uid,
        productId: product.id,
        rating: ratingValue,
        createdAt: Timestamp.now(),
      });
      setUserRating(ratingValue);
      toast({ title: "მადლობა შეფასებისთვის!", description: `თქვენი შეფასება (${ratingValue} ვარსკვლავი) დაფიქსირდა.` });
    } catch (error) {
      console.error("Error setting user rating:", error);
      toast({ title: "შეფასების შეცდომა", description: "დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.", variant: "destructive" });
    } finally {
      setIsRatingLoading(false);
    }
  };


  let displayPrice = product.price;
  if (product.discountPercentage && product.discountPercentage > 0) {
    displayPrice = product.price - (product.price * product.discountPercentage) / 100;
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <Link href="/catalog" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center group">
          <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          უკან კატალოგში
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-xl group bg-card">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              data-ai-hint={product.dataAiHint || "clothing item"}
            />
            {product.discountPercentage && product.discountPercentage > 0 && (
              <Badge variant="destructive" className="absolute top-3 left-3 text-sm px-2 py-1 shadow-md">
                -{product.discountPercentage}%
              </Badge>
            )}
            {product.brandName && (
              <Badge variant="secondary" className="absolute top-3 right-3 text-xs px-2 py-1 shadow-md">
                {product.brandName}
              </Badge>
            )}
          </div>
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.slice(0, 4).map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(url)}
                  className={cn(
                    "aspect-square relative rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selectedImage === url ? "border-primary ring-primary" : "border-transparent hover:border-muted-foreground/50"
                  )}
                  aria-label={`სურათის ${index + 1} ჩვენება`}
                >
                  <Image
                    src={url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="10vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold text-primary mb-2">{product.name}</h1>
            <p className="text-lg text-foreground/80">
              {product.description.split('.')[0] + '.'}
            </p>
          </div>
          
          {/* Existing Product Rating (Admin Set) */}
          {product.averageRating !== undefined && typeof product.averageRating === 'number' && product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => {
                const ratingValue = product.averageRating!;
                if (ratingValue >= i + 1) {
                  return <Star key={`overall-star-${i}`} className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
                } else if (ratingValue >= i + 0.5) {
                  return <StarHalf key={`overall-star-${i}`} className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
                } else {
                  return <Star key={`overall-star-${i}`} className="h-5 w-5 text-muted-foreground opacity-70" />;
                }
              })}
              <span className="text-sm text-muted-foreground ml-1.5">({product.reviewCount} შეფასება)</span>
            </div>
          )}


          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-accent">
              L{displayPrice.toFixed(2)}
            </p>
            {product.discountPercentage && product.discountPercentage > 0 && (
              <p className="text-xl text-muted-foreground line-through">
                L{product.price.toFixed(2)}
              </p>
            )}
          </div>

          {needsSizeSelection && (
            <div className="space-y-2">
              <h3 className="text-md font-semibold text-foreground">აირჩიეთ ზომა:</h3>
              <RadioGroup
                value={selectedSize || undefined}
                onValueChange={setSelectedSize}
                className="flex flex-wrap gap-2"
              >
                {product.sizes.map(size => (
                  <Fragment key={size}>
                    <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                    <Label
                      htmlFor={`size-${size}`}
                      className={cn(
                        "cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors",
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {size}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </div>
          )}

          {needsColorSelection && (
            <div className="space-y-2">
              <h3 className="text-md font-semibold text-foreground">აირჩიეთ ფერი:</h3>
              <RadioGroup
                value={selectedColor || undefined}
                onValueChange={setSelectedColor}
                className="flex flex-wrap gap-2"
              >
                {product.colors.map(color => (
                  <Fragment key={color}>
                    <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                    <Label
                      htmlFor={`color-${color}`}
                      className={cn(
                        "cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors",
                        selectedColor === color
                          ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {color}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </div>
          )}
          
          {/* User Rating Section */}
          {firebaseUser && (
            <div className="pt-4 border-t border-border space-y-2">
              <h3 className="text-md font-semibold text-foreground">თქვენი შეფასება:</h3>
              {isRatingLoading && !userRating ? (
                 <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">იტვირთება...</span>
                 </div>
              ) : (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => handleSetRating(starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50"
                      aria-label={`შეაფასეთ ${starValue} ვარსკვლავით`}
                      disabled={isRatingLoading}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          (hoveredRating !== null && starValue <= hoveredRating) || (hoveredRating === null && userRating !== null && starValue <= userRating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground hover:text-yellow-400"
                        )}
                      />
                    </button>
                  ))}
                  {isRatingLoading && userRating && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground ml-2" />}
                </div>
              )}
              {userRating !== null && !isRatingLoading && <p className="text-xs text-muted-foreground">თქვენი მიმდინარე შეფასება: {userRating} ვარსკვლავი.</p>}
            </div>
          )}


          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow"
              aria-label={`${product.name}-ის კალათაში დამატება`}
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> კალათაში დამატება
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleToggleFavorite}
              disabled={!favoritesInitialized}
              className="flex-1 shadow-md hover:shadow-lg transition-shadow border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
              aria-label={isCurrentlyFavorite ? `${product.name}-ის რჩეულებიდან ამოღება` : `${product.name}-ის რჩეულებში დამატება`}
            >
              <Heart className={cn("mr-2 h-5 w-5 transition-colors", isCurrentlyFavorite ? "fill-destructive text-destructive" : "text-primary")} />
              {isCurrentlyFavorite ? 'რჩეულებიდან ამოღება' : 'რჩეულებში დამატება'}
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <h2 className="font-headline text-xl font-semibold text-foreground mb-3">სრული აღწერა</h2>
            <article className="prose prose-sm sm:prose-base max-w-none text-foreground/90 whitespace-pre-line">
              {product.description}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
