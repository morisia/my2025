
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { APP_NAME } from '@/lib/constants';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { CartProvider } from '@/contexts/cart-context';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: `აღმოაჩინეთ ავთენტური ქართული ტრადიციული ტანსაცმელი ${APP_NAME}-ში. დაათვალიერეთ ჩვენი ჩოხების, ქართული კაბების და სხვა კოლექცია.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FavoritesProvider>
          <CartProvider>
            <Header />
            <main className="flex-grow container py-8 px-[10%]">
              {children}
            </main>
            <Footer />
            <Toaster />
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
