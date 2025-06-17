
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import ProductView from '@/components/product-view';
import type { ClothingItem } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProductBySlug(slug: string): Promise<ClothingItem | null> {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('slug', '==', slug), limit(1));
    const productSnapshot = await getDocs(q);

    if (productSnapshot.empty) {
      return null;
    }
    const doc = productSnapshot.docs[0];
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
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = params; // Destructure slug from params
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: `პროდუქტი ვერ მოიძებნა | ${APP_NAME}`,
      description: `მოთხოვნილი პროდუქტი ვერ მოიძებნა ${APP_NAME}-ში.`,
    };
  }

  const shortDescription = product.description.split('.')[0] + '.';
  const primaryImageUrl = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/500x700.png';

  return {
    title: `${product.name} | ${APP_NAME}`,
    description: `შეიძინეთ ${product.name}. ${shortDescription} დაათვალიერეთ მეტი ${APP_NAME}-ში.`,
    openGraph: {
      title: `${product.name} | ${APP_NAME}`,
      description: shortDescription,
      images: [
        {
          url: primaryImageUrl,
          width: 500, 
          height: 700,
          alt: product.name,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ${APP_NAME}`,
      description: shortDescription,
      images: [primaryImageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = params; // Destructure slug from params
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
