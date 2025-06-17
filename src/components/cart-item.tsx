
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (cartItemId: string, newQuantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const handleIncreaseQuantity = () => {
    onQuantityChange(item.id, item.quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(event.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      onQuantityChange(item.id, newQuantity);
    }
  };

  const itemSubtotal = item.price * item.quantity;

  return (
    <div className="flex items-start sm:items-center gap-4 py-4 border-b last:border-b-0 flex-col sm:flex-row">
      <Link href={`/catalog/${item.slug}`} className="shrink-0">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={100}
          height={133}
          className="rounded-md object-cover aspect-[3/4]"
          data-ai-hint={item.dataAiHint || "clothing item"}
        />
      </Link>
      <div className="flex-grow">
        <Link href={`/catalog/${item.slug}`}>
          <h3 className="font-headline text-lg font-medium text-foreground hover:text-primary transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">ფასი: L{item.price.toFixed(2)}</p>
        {item.selectedSize && <p className="text-sm text-muted-foreground">ზომა: {item.selectedSize}</p>}
        {item.selectedColor && <p className="text-sm text-muted-foreground">ფერი: {item.selectedColor}</p>}
      </div>
      <div className="flex items-center gap-2 sm:ml-auto mt-2 sm:mt-0 w-full sm:w-auto justify-between">
        <div className="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" onClick={handleDecreaseQuantity} disabled={item.quantity <= 1} aria-label="რაოდენობის შემცირება">
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            id={`cart-item-quantity-${item.id}`}
            name={`quantity-${item.id}`}
            value={item.quantity}
            onChange={handleInputChange}
            className="h-9 w-12 text-center border-0 focus-visible:ring-0 bg-transparent"
            min="1"
            aria-label="ნივთის რაოდენობა"
          />
          <Button variant="ghost" size="icon" onClick={handleIncreaseQuantity} aria-label="რაოდენობის გაზრდა">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-semibold text-foreground w-20 text-right">L{itemSubtotal.toFixed(2)}</p>
        <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive hover:text-destructive/80" aria-label="ნივთის წაშლა">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
