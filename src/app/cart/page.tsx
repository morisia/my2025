
'use client'; 

import Link from 'next/link';
import { CartItem as CartItemComponent } from '@/components/cart-item';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/hooks/use-cart-store';
import type { CartItem as CartItemType } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartSubtotal, 
    isCartInitialized,
  } = useCartStore();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    if (isCartInitialized && cartItems.length === 0) {
      toast({
        title: 'თქვენი კალათა ცარიელია',
        description: 'გადამისამართება კატალოგის გვერდზე...',
      });
      router.push('/catalog'); 
    }
  }, [cartItems, isCartInitialized, router, toast]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    const removedItemName = removeFromCart(itemId);
    if (removedItemName) {
      toast({
        title: `${removedItemName} ამოღებულია კალათიდან.`,
      });
    }
  };

  const cartSubtotal = getCartSubtotal();
  const shippingCost = cartSubtotal > 0 ? 15 : 0; 
  const cartTotal = cartSubtotal + shippingCost;

  if (!isCartInitialized || (isCartInitialized && cartItems.length === 0)) {
    return (
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary mb-2">საყიდლების კალათა</h1>
        </header>
        <div className="flex justify-center items-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
          {cartItems.length === 0 && isCartInitialized ? 'კალათა ცარიელია, გადამისამართება...' : 'იტვირთება თქვენი კალათა...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">საყიდლების კალათა</h1>
        <p className="text-lg text-foreground/80">შეამოწმეთ თქვენი ნივთები და გადადით გადახდაზე.</p>
      </header>

      {cartItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-4">თქვენი ნივთები ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h2>
            <div className="space-y-4">
              {cartItems.map((item: CartItemType) => (
                <CartItemComponent
                  key={item.id}
                  item={item} // CartItemType already expects imageUrl (singular)
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </div>

          <Card className="lg:col-span-1 sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">შეკვეთის შეჯამება</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">შუალედური ჯამი</span>
                <span className="font-medium text-foreground">L{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">მიწოდება</span>
                <span className="font-medium text-foreground">L{shippingCost.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-foreground">სულ</span>
                <span className="text-primary">L{cartTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                asChild
              >
                <Link href="/checkout">
                  <CreditCard className="mr-2 h-5 w-5" /> გადახდაზე გადასვლა
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/catalog">შოპინგის გაგრძელება</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

export function CartPageMetadata() {
  return {
    title: 'საყიდლების კალათა',
    description: `შეამოწმეთ და მართეთ ნივთები თქვენს საყიდლების კალათაში ${APP_NAME}-ში.`,
  };
}
