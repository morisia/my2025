
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClothingItemCard } from '@/components/clothing-item-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ListRestart, Search, Package } from 'lucide-react';
import type { ClothingItem } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';


interface CatalogDisplayProps {
  initialProducts: ClothingItem[];
  uniqueCategories: string[];
  adEnabled?: boolean;
  adImageUrl?: string;
  adLinkUrl?: string;
  adAltText?: string;
}

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest' | '';
const ALL_CATEGORIES_VALUE = "__ALL_CATEGORIES_PLACEHOLDER__"; 

export function CatalogDisplay({ 
  initialProducts, 
  uniqueCategories,
  adEnabled,
  adImageUrl,
  adLinkUrl,
  adAltText,
}: CatalogDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); 
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    if (!mounted) return initialProducts; 

    let products = [...initialProducts];

    if (searchTerm) {
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) { 
      products = products.filter(product => product.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        break;
    }
    return products;
  }, [initialProducts, searchTerm, selectedCategory, sortBy, mounted]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('newest');
  };
  
  const primaryImageUrl = (imageUrls: string[] | undefined) => {
    return (imageUrls && imageUrls.length > 0) ? imageUrls[0] : 'https://placehold.co/500x700.png';
  };


  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">ჩვენი კოლექცია</h1>
        <p className="text-lg text-foreground/80">აღმოაჩინეთ ავთენტური და ხელნაკეთი ქართული სამოსი.</p>
      </header>

      {adEnabled && adImageUrl && (
      <section className="my-8 p-4 bg-card/50 rounded-lg shadow">
        <Link href={adLinkUrl || '#'} className="block group" target="_blank" rel="noopener noreferrer">
          <div className="aspect-[16/2] sm:aspect-[16/1.5] relative overflow-hidden rounded-md">
            <Image
              src={adImageUrl}
              alt={adAltText || "Advertisement"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="advertisement promotion"
            />
          </div>
        </Link>
      </section>
      )}


      <section className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 z-40 border-b">
        <div className="container px-0 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              id="catalog-search-input"
              name="search_query"
              placeholder="პროდუქტების ძიება..." 
              className="pl-10 w-full" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select 
              name="category" 
              value={selectedCategory === '' ? ALL_CATEGORIES_VALUE : selectedCategory} 
              onValueChange={(value) => setSelectedCategory(value === ALL_CATEGORIES_VALUE ? '' : value)}
            >
              <SelectTrigger id="category-filter-trigger" name="category-filter-trigger-name" className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="კატეგორია" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>ყველა კატეგორია</SelectItem>
                {uniqueCategories.length > 0 ? (
                  uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>კატეგორიები არ მოიძებნა</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select name="sort_by" value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger id="sort-by-filter-trigger" name="sort-by-filter-trigger-name" className="w-full md:w-[180px]">
                <SelectValue placeholder="დალაგება" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">უახლესი</SelectItem>
                <SelectItem value="price-asc">ფასი: დაბლიდან მაღლა</SelectItem>
                <SelectItem value="price-desc">ფასი: მაღლიდან დაბლა</SelectItem>
                <SelectItem value="name-asc">სახელი: ა-ჰ</SelectItem>
                <SelectItem value="name-desc">სახელი: ჰ-ა</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" aria-label="ფილტრების გასუფთავება" onClick={handleResetFilters}>
              <ListRestart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {mounted && filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredAndSortedProducts.map((item) => (
            <ClothingItemCard key={item.id} item={{...item, imageUrl: primaryImageUrl(item.imageUrls)}} />
          ))}
        </div>
      ) : mounted && filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">პროდუქტები ვერ მოიძებნა.</p>
          <p className="text-sm text-muted-foreground">სცადეთ მოგვიანებით ან შეცვალეთ ფილტრები.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {initialProducts.map((item) => (
            <ClothingItemCard key={item.id} item={{...item, imageUrl: primaryImageUrl(item.imageUrls)}} />
          ))}
        </div>
      )}
    </div>
  );
}
