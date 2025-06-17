
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { ClothingItemCard } from '@/components/clothing-item-card';
import type { ClothingItem } from '@/lib/types';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

const ITEMS_PER_SECTION = 4;

interface SiteConfigData {
  bannerImageUrl?: string;
  bannerHeading?: string;
  bannerSubtext?: string;
  bannerCtaText?: string;
  bannerCtaLink?: string;
  craftsmanshipTitle?: string;
  craftsmanshipParagraph1?: string;
  craftsmanshipParagraph2?: string;
  craftsmanshipImageUrl?: string;
  craftsmanshipImageAiHint?: string;
  craftsmanshipLinkText?: string;
  craftsmanshipLinkUrl?: string;
  enableHomePageAd?: boolean;
  homePageAdImageUrl?: string;
  homePageAdLinkUrl?: string;
  homePageAdAltText?: string;
}

async function fetchProductsFromDb(
  genderFilter?: 'men' | 'women' | 'children',
  count: number = ITEMS_PER_SECTION,
  orderByField: string = 'createdAt', 
  orderDir: 'desc' | 'asc' = 'desc'    
): Promise<ClothingItem[]> {
  try {
    const productsCollection = collection(db, 'products');
    let q;
    if (genderFilter) {
      q = query(
        productsCollection,
        where('gender', '==', genderFilter),
        orderBy(orderByField, orderDir), 
        limit(count)
      );
    } else {
      q = query(productsCollection, orderBy(orderByField, orderDir), limit(count));
    }
    const productSnapshot = await getDocs(q);
    return productSnapshot.docs.map(doc => {
      const data = doc.data();
      const product: ClothingItem = {
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrls: data.imageUrls || [],
        category: data.category,
        sizes: data.sizes || [],
        colors: data.colors || [],
        slug: data.slug,
        stock: data.stock || 0,
        dataAiHint: data.dataAiHint || undefined,
        discountPercentage: data.discountPercentage || undefined,
        brandName: data.brandName || undefined,
        gender: data.gender || undefined,
        averageRating: data.averageRating, 
        reviewCount: data.reviewCount,   
      };
      return product;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function fetchSiteConfiguration(): Promise<SiteConfigData | null> {
  try {
    const configDocRef = doc(db, 'siteConfiguration', 'main');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteConfigData;
    }
    console.warn("Site configuration document 'siteConfiguration/main' not found.");
    return null;
  } catch (error) {
    console.error("Error fetching site configuration:", error);
    return null;
  }
}

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<ClothingItem[]>([]);
  const [mensItems, setMensItems] = useState<ClothingItem[]>([]);
  const [womensItems, setWomensItems] = useState<ClothingItem[]>([]);
  const [childrensItems, setChildrensItems] = useState<ClothingItem[]>([]);
  
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingMens, setIsLoadingMens] = useState(true);
  const [isLoadingWomens, setIsLoadingWomens] = useState(true);
  const [isLoadingChildrens, setIsLoadingChildrens] = useState(true);

  const [siteConfig, setSiteConfig] = useState<SiteConfigData | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const loadSiteConfig = async () => {
      setIsLoadingConfig(true);
      const config = await fetchSiteConfiguration();
      setSiteConfig(config);
      setIsLoadingConfig(false);
    };
    loadSiteConfig();

    const fetchLowestRatedFeatured = async () => {
      setIsLoadingFeatured(true);
      const items = await fetchProductsFromDb(undefined, ITEMS_PER_SECTION, 'averageRating', 'asc');
      setFeaturedItems(items);
      setIsLoadingFeatured(false);
    };
    fetchLowestRatedFeatured(); 

    const fetchGenderSpecificItems = async () => {
      setIsLoadingMens(true);
      const men = await fetchProductsFromDb('men', ITEMS_PER_SECTION, 'createdAt', 'desc');
      setMensItems(men);
      setIsLoadingMens(false);

      setIsLoadingWomens(true);
      const women = await fetchProductsFromDb('women', ITEMS_PER_SECTION, 'createdAt', 'desc');
      setWomensItems(women);
      setIsLoadingWomens(false);
      
      setIsLoadingChildrens(true);
      const children = await fetchProductsFromDb('children', ITEMS_PER_SECTION, 'createdAt', 'desc');
      setChildrensItems(children);
      setIsLoadingChildrens(false);
    };
    fetchGenderSpecificItems();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // User-specific logic can still go here if needed in the future.
    });
    return () => unsubscribe();
  }, []);

  const renderProductSection = (title: string, items: ClothingItem[], isLoading: boolean, categoryLink?: string) => {
    if (isLoading) {
      return (
        <section>
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">{title}</h2>
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </section>
      );
    }
    if (items.length === 0 && !isLoading) {
      return (
         <section>
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">{title}</h2>
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>ამ კატეგორიაში პროდუქტები ვერ მოიძებნა.</p>
          </div>
        </section>
      );
    }
    return (
      <section>
        <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((item) => (
            <ClothingItemCard key={item.id} item={item} />
          ))}
        </div>
        {categoryLink && (
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link href={categoryLink}>ყველას ნახვა</Link>
            </Button>
          </div>
        )}
      </section>
    );
  };

  const defaultBannerHeading = `კეთილი იყოს თქვენი მობრძანება ${APP_NAME}-ში`;
  const defaultBannerSubtext = "განიცადეთ ავთენტური ქართული ტრადიციული ტანსაცმლის მარადიული ელეგანტურობა. ხელნაკეთი მემკვიდრეობით, შექმნილია დღევანდელობისთვის.";
  const defaultBannerCtaText = "დაათვალიერეთ ჩვენი კოლექცია";
  const defaultBannerCtaLink = "/catalog";
  const defaultBannerImageUrl = "https://placehold.co/1200x400.png?text=Banner+Image";

  const defaultCraftsmanshipTitle = "ჩვენი ხელოსნობა";
  const defaultCraftsmanshipP1 = `${APP_NAME}-ში, ჩვენ ვართ ერთგულნი საქართველოს მდიდარი კულტურული მემკვიდრეობის შენარჩუნების ჩვენი საგულდაგულოდ დამზადებული ტრადიციული სამოსის მეშვეობით. თითოეული ნივთი ჰყვება ისტორიას, რომელიც ნაქსოვია ისტორიითა და ხელოვნებით.`;
  const defaultCraftsmanshipP2 = "ჩვენ ვიყენებთ მაღალი ხარისხის მასალებს და ვთანამშრომლობთ გამოცდილ ხელოსნებთან, რათა მოგაწოდოთ ავთენტური სამოსი, რომელიც აერთიანებს ტრადიციას თანამედროვე სტილთან.";
  const defaultCraftsmanshipImageUrl = "https://placehold.co/600x400.png";
  const defaultCraftsmanshipImageAiHint = "artisan craft";
  const defaultCraftsmanshipLinkText = "შეიტყვეთ მეტი ჩვენ შესახებ";
  const defaultCraftsmanshipLinkUrl = "/about";

  const defaultHomePageAdImageUrl = "https://placehold.co/1000x120.png?text=Homepage+Ad";
  const defaultHomePageAdLinkUrl = "#";
  const defaultHomePageAdAltText = "Homepage Advertisement";


  return (
    <div className="space-y-16">
      <section className="relative bg-gradient-to-br from-primary/30 via-background to-background rounded-lg p-8 md:p-16 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <Image 
            src={isLoadingConfig ? "https://placehold.co/1200x600.png?text=Loading..." : (siteConfig?.bannerImageUrl || defaultBannerImageUrl)} 
            alt="ბანერის სურათი" 
            fill={true}
            className="pointer-events-none object-cover"
            data-ai-hint={isLoadingConfig ? "loading" : (siteConfig?.bannerImageUrl ? "dynamic banner" : "georgian pattern")}
            priority
          />
        </div>
        <div className="relative z-10">
          <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary mb-4">
            {isLoadingConfig ? <Loader2 className="h-10 w-10 mx-auto animate-spin" /> : (siteConfig?.bannerHeading || defaultBannerHeading)}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            {isLoadingConfig ? "იტვირთება..." : (siteConfig?.bannerSubtext || defaultBannerSubtext)}
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={isLoadingConfig ? "#" : (siteConfig?.bannerCtaLink || defaultBannerCtaLink)}>
              {isLoadingConfig ? "..." : (siteConfig?.bannerCtaText || defaultBannerCtaText)} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {renderProductSection("რჩეული კოლექცია", featuredItems, isLoadingFeatured, "/catalog")}
      
      {!isLoadingConfig && siteConfig?.enableHomePageAd && (
        <section className="my-12 p-6 bg-card rounded-lg shadow-md">
          <Link href={siteConfig.homePageAdLinkUrl || '#'} className="block group" target="_blank" rel="noopener noreferrer">
            <div className="aspect-[16/2] sm:aspect-[16/1.5] relative overflow-hidden rounded-md">
              <Image
                src={siteConfig.homePageAdImageUrl || defaultHomePageAdImageUrl}
                alt={siteConfig.homePageAdAltText || defaultHomePageAdAltText}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="advertisement banner"
              />
            </div>
          </Link>
        </section>
      )}
      {isLoadingConfig && ( 
         <section className="my-12 p-6 bg-card rounded-lg shadow-md">
            <div className="aspect-[16/2] sm:aspect-[16/1.5] relative overflow-hidden rounded-md bg-muted animate-pulse">
            </div>
        </section>
      )}

      {renderProductSection("კაცის სამოსი", mensItems, isLoadingMens, "/catalog?gender=men")}
      
      {renderProductSection("ქალის სამოსი", womensItems, isLoadingWomens, "/catalog?gender=women")}

      {renderProductSection("ბავშვის სამოსი", childrensItems, isLoadingChildrens, "/catalog?gender=children")}

      <section className="bg-card p-8 md:p-12 rounded-lg shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-headline text-3xl font-semibold text-primary mb-4">
              {isLoadingConfig ? <Loader2 className="h-8 w-8 animate-spin" /> : (siteConfig?.craftsmanshipTitle || defaultCraftsmanshipTitle)}
            </h2>
            <p className="text-foreground/80 mb-4">
              {isLoadingConfig ? "იტვირთება..." : (siteConfig?.craftsmanshipParagraph1 || defaultCraftsmanshipP1)}
            </p>
            <p className="text-foreground/80 mb-6">
              {isLoadingConfig ? "..." : (siteConfig?.craftsmanshipParagraph2 || defaultCraftsmanshipP2)}
            </p>
            <Button asChild variant="link" className="text-accent p-0 hover:text-accent/80">
              <Link href={isLoadingConfig ? "#" : (siteConfig?.craftsmanshipLinkUrl || defaultCraftsmanshipLinkUrl)}>
                {isLoadingConfig ? "..." : (siteConfig?.craftsmanshipLinkText || defaultCraftsmanshipLinkText)} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden aspect-video">
            {isLoadingConfig ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Image
                  src={siteConfig?.craftsmanshipImageUrl || defaultCraftsmanshipImageUrl}
                  alt={siteConfig?.craftsmanshipTitle || defaultCraftsmanshipTitle}
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                  data-ai-hint={siteConfig?.craftsmanshipImageAiHint || defaultCraftsmanshipImageAiHint}
                />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

