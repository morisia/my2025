
import type { Timestamp } from 'firebase/firestore';

export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  sizes: string[];
  colors: string[];
  slug: string;
  stock: number;
  dataAiHint?: string;
  discountPercentage?: number;
  brandName?: string;
  gender?: 'men' | 'women' | 'children';
  averageRating?: number; // Average rating from 0 to 5
  reviewCount?: number;   // Total number of reviews
}

export interface CartItem {
  id: string; // Composite ID: productId-selectedSize-selectedColor
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  dataAiHint?: string;
  // Retain original available sizes and colors for potential future use (e.g., editing in cart)
  availableSizes: string[];
  availableColors: string[];
}

export interface FavoriteItem extends ClothingItem {}

export interface NavLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  key?: string;
}

export interface UserProfileData {
  firebaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  addressCity?: string;
  postalCode?: string;
  createdAt: Timestamp;
  avatarUrl?: string;
}

export interface AdminPanelUser {
  firebaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender?: 'male' | 'female';
  addressCity?: string;
  postalCode?: string;
  createdAt: Timestamp;
  avatarUrl?: string;
}

export interface OrderProductItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
  slug?: string | null;
  dataAiHint?: string | null;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface CustomerInfo {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
}

export interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded' | 'Pending Payment';

export interface AdminPanelOrder {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  status: OrderStatus;
  products: OrderProductItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  notes?: string | null;
  paymentMethod?: string;
  transactionId?: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface FooterLinkConfig {
  id: string;
  label: string;
  href: string;
}

export interface SiteSettings {
  siteName: string;
  contactEmail: string; // General site contact email
  maintenanceMode: boolean;
  seoTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  backgroundHsl: string;
  primaryHsl: string;
  accentHsl: string;
  logoUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterCardType: string;
  twitterSite: string;
  twitterCreator: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  stripeEnabled: boolean;
  stripePublicKey: string;
  tbcPayEnabled: boolean;
  tbcPayApiClientId: string;
  /**
   * TBC Pay API Secret.
   * VERY SENSITIVE! This should ideally be stored encrypted at rest (e.g., via server-side encryption before saving to Firestore)
   * or managed via a dedicated secret management service (like Google Secret Manager) and accessed only by backend functions.
   * Storing it directly in Firestore in plaintext, even if only accessible by admin, is a security risk.
   * This field should be handled with extreme care and preferably replaced with a secure secret management strategy.
   */
  tbcPayApiSecret: string;
  cashOnDeliveryEnabled: boolean;
  enableFlatRateShipping: boolean;
  defaultShippingCost: number;
  freeShippingThreshold: number;
  bannerImageUrl: string;
  bannerHeading: string;
  bannerSubtext: string;
  bannerCtaText: string;
  bannerCtaLink: string;
  craftsmanshipTitle: string;
  craftsmanshipParagraph1: string;
  craftsmanshipParagraph2: string;
  craftsmanshipImageUrl: string;
  craftsmanshipImageAiHint: string;
  craftsmanshipLinkText: string;
  craftsmanshipLinkUrl: string;
  footerAppName: string;
  footerDescription: string;
  footerColumn2Title: string;
  footerColumn3Title: string;
  footerSubscribeText: string;
  footerCopyrightText: string;
  footerMadeInText: string;
  footerQuickLinks: FooterLinkConfig[];
  contactPageAddress?: string;
  contactPagePhone?: string;
  contactPageDisplayEmail?: string;
  contactPageWorkingHours?: string;
  contactPageBankAccount?: string;

  // Advertisement Settings
  enableHomePageAd?: boolean;
  homePageAdImageUrl?: string;
  homePageAdLinkUrl?: string;
  homePageAdAltText?: string;

  enableCatalogPageAd?: boolean;
  catalogPageAdImageUrl?: string;
  catalogPageAdLinkUrl?: string;
  catalogPageAdAltText?: string;
}

export interface UserProductRating {
  userId: string;
  productId: string;
  rating: number; // Typically 1-5
  createdAt: Timestamp;
}
