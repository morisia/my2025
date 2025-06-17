
import { CatalogDisplay } from '@/components/catalog-display'; 
import { APP_NAME } from '@/lib/constants';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc as getFirestoreDoc } from 'firebase/firestore'; // aliased getDoc
import type { ClothingItem, SiteSettings } from '@/lib/types';

export const metadata: Metadata = {
  title: 'კატალოგი',
  description: `დაათვალიერეთ ჩვენი ტრადიციული ქართული ტანსაცმლის კოლექცია ${APP_NAME}-ში.`,
};

async function getProducts(): Promise<ClothingItem[]> {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('createdAt', 'desc'));
    const productSnapshot = await getDocs(q);
    const productsList = productSnapshot.docs.map(doc => {
      const data = doc.data();
      const productForClient: ClothingItem = {
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
      };
      return productForClient;
    });
    return productsList;
  } catch (error) {
    console.error("Error fetching products for catalog:", error);
    return []; 
  }
}

async function getCatalogAdConfig() {
  try {
    const configDocRef = doc(db, 'siteConfiguration', 'main');
    const docSnap = await getFirestoreDoc(configDocRef); // Use aliased getDoc
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteSettings>;
      return {
        adEnabled: data.enableCatalogPageAd || false,
        adImageUrl: data.catalogPageAdImageUrl || "https://placehold.co/1200x150.png?text=Catalog+Ad",
        adLinkUrl: data.catalogPageAdLinkUrl || "#",
        adAltText: data.catalogPageAdAltText || "Catalog Page Advertisement",
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching catalog ad config:", error);
    return null;
  }
}


export default async function CatalogPage() {
  const items = await getProducts();
  const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
  const adConfig = await getCatalogAdConfig();

  return (
    <CatalogDisplay 
      initialProducts={items} 
      uniqueCategories={uniqueCategories} 
      adEnabled={adConfig?.adEnabled}
      adImageUrl={adConfig?.adImageUrl}
      adLinkUrl={adConfig?.adLinkUrl}
      adAltText={adConfig?.adAltText}
    />
  );
}
