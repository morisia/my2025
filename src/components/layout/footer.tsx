
'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Facebook, Instagram, Twitter, Info, Loader2 } from 'lucide-react'; // Added Loader2
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SiteSettings, FooterLinkConfig } from '@/lib/types';

interface FooterConfigData {
  footerAppName?: string;
  footerDescription?: string;
  footerColumn2Title?: string;
  footerQuickLinks?: FooterLinkConfig[];
  footerColumn3Title?: string;
  footerSubscribeText?: string;
  footerCopyrightText?: string;
  footerMadeInText?: string;
}

async function fetchSiteConfiguration(): Promise<FooterConfigData | null> {
  try {
    const configDocRef = doc(db, 'siteConfiguration', 'main');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      const allSettings = docSnap.data() as SiteSettings;
      return {
        footerAppName: allSettings.footerAppName,
        footerDescription: allSettings.footerDescription,
        footerColumn2Title: allSettings.footerColumn2Title,
        footerQuickLinks: allSettings.footerQuickLinks && Array.isArray(allSettings.footerQuickLinks) ? allSettings.footerQuickLinks : [],
        footerColumn3Title: allSettings.footerColumn3Title,
        footerSubscribeText: allSettings.footerSubscribeText,
        footerCopyrightText: allSettings.footerCopyrightText,
        footerMadeInText: allSettings.footerMadeInText,
      };
    }
    console.warn("Site configuration document 'siteConfiguration/main' not found for footer.");
    return null;
  } catch (error) {
    console.error("Error fetching site configuration for footer:", error);
    return null;
  }
}

const FALLBACK_QUICK_LINKS: FooterLinkConfig[] = [
    { id: 'fallback-about', href: '/about', label: 'ჩვენ შესახებ' },
    { id: 'fallback-shipping', href: '/shipping', label: 'მიწოდება და დაბრუნება' },
    { id: 'fallback-privacy', href: '/privacy', label: 'კონფიდენციალურობა' },
    { id: 'fallback-terms', href: '/terms', label: 'წესები' },
];


export function Footer() {
  const currentYear = new Date().getFullYear();
  const [siteConfig, setSiteConfig] = useState<FooterConfigData | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const loadSiteConfig = async () => {
      setIsLoadingConfig(true);
      const config = await fetchSiteConfiguration();
      setSiteConfig(config);
      setIsLoadingConfig(false);
    };
    loadSiteConfig();
  }, []);

  const defaultFooterAppName = APP_NAME;
  const defaultFooterDescription = "აღმოაჩინეთ ტრადიციული ქართული სამოსის ელეგანტურობა. ხელნაკეთი ვნებითა და მემკვიდრეობით.";
  const defaultFooterColumn2Title = "სწრაფი ბმულები";
  const defaultFooterColumn3Title = "დაგვიკავშირდით";
  const defaultFooterSubscribeText = "გამოიწერეთ ჩვენი სიახლეები განახლებებისა და სპეციალური შეთავაზებებისთვის.";
  const defaultFooterCopyrightText = "ყველა უფლება დაცულია.";
  const defaultFooterMadeInText = "შექმნილია ❤️-ით თბილისში.";

  // Determine which links to display based on mounted state and loading state
  let quickLinksToRender: React.ReactNode;
  if (!hasMounted) {
    quickLinksToRender = FALLBACK_QUICK_LINKS.map((link) => (
      <li key={link.id || link.href}>
        <Link href={link.href} className="text-sm hover:text-primary transition-colors">
          {link.label}
        </Link>
      </li>
    ));
  } else if (isLoadingConfig) {
    quickLinksToRender = Array.from({ length: 3 }).map((_, index) => (
      <li key={`skeleton-link-${index}`} className="h-4 bg-muted-foreground/20 rounded w-3/4 animate-pulse"></li>
    ));
  } else {
    const links = (siteConfig?.footerQuickLinks && siteConfig.footerQuickLinks.length > 0)
      ? siteConfig.footerQuickLinks
      : FALLBACK_QUICK_LINKS;
    if (links.length > 0) {
        quickLinksToRender = links.map((link) => (
            <li key={link.id || link.href}>
            <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                {link.label}
            </Link>
            </li>
        ));
    } else {
         quickLinksToRender = <li><p className="text-sm">ბმულები არ არის კონფიგურირებული.</p></li>;
    }
  }


  return (
    <footer className="bg-muted/50 text-muted-foreground mt-auto">
      <Separator />
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-headline text-xl font-semibold text-foreground mb-4">
              {!hasMounted ? defaultFooterAppName : (isLoadingConfig ? <Loader2 className="h-5 w-5 animate-spin inline-block" /> : (siteConfig?.footerAppName || defaultFooterAppName))}
            </h3>
            <p className="text-sm">
              {!hasMounted ? defaultFooterDescription : (isLoadingConfig ? 'იტვირთება...' : (siteConfig?.footerDescription || defaultFooterDescription))}
            </p>
          </div>
          <div>
            <h4 className="font-headline text-lg font-semibold text-foreground mb-4">
              {!hasMounted ? defaultFooterColumn2Title : (isLoadingConfig ? <Loader2 className="h-5 w-5 animate-spin inline-block" /> : (siteConfig?.footerColumn2Title || defaultFooterColumn2Title))}
            </h4>
            <ul className="space-y-2">
              {quickLinksToRender}
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-lg font-semibold text-foreground mb-4">
              {!hasMounted ? defaultFooterColumn3Title : (isLoadingConfig ? <Loader2 className="h-5 w-5 animate-spin inline-block" /> : (siteConfig?.footerColumn3Title || defaultFooterColumn3Title))}
            </h4>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Instagram" className="hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Twitter" className="hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
            <p className="text-sm mt-4">
              {!hasMounted ? defaultFooterSubscribeText : (isLoadingConfig ? 'იტვირთება...' : (siteConfig?.footerSubscribeText || defaultFooterSubscribeText))}
            </p>
          </div>
        </div>
        <Separator />
        <div className="text-center text-sm pt-8">
          <p>&copy; {currentYear} {!hasMounted ? APP_NAME : (isLoadingConfig ? '...' : (siteConfig?.footerAppName || defaultFooterAppName))}. {!hasMounted ? defaultFooterCopyrightText : (isLoadingConfig ? '...' : (siteConfig?.footerCopyrightText || defaultFooterCopyrightText))}</p>
          <p className="mt-1">{!hasMounted ? defaultFooterMadeInText : (isLoadingConfig ? '...' : (siteConfig?.footerMadeInText || defaultFooterMadeInText))}</p>
        </div>
      </div>
    </footer>
  );
}

