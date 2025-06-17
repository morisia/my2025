
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS as BASE_NAV_LINKS, USER_NAV_LINKS as BASE_USER_NAV_LINKS, APP_NAME } from '@/lib/constants';
import type { NavLink } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFavoritesStore } from '@/hooks/use-favorites-store';
import { useCartStore } from '@/hooks/use-cart-store';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { User } from 'lucide-react'; // Imported User icon for direct comparison

interface MainNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function MainNav({ isMobile = false, onLinkClick }: MainNavProps) {
  const pathname = usePathname();
  const { favoriteItems, isInitialized: favoritesStoreInitialized } = useFavoritesStore();
  const { getTotalItemCount, isCartInitialized } = useCartStore();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // State for admin link multi-click feature
  const [profileClickCount, setProfileClickCount] = useState(0);
  const [lastProfileClickTime, setLastProfileClickTime] = useState(0);
  const CLICK_TIMEOUT_MS = 2000; // Reset click sequence if clicks are more than 2s apart
  const ADMIN_CLICKS_TARGET = 8; // Number of clicks to open admin page

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  const totalCartItems = getTotalItemCount();

  const getProcessedUserNavLinks = (): NavLink[] => {
    if (!authResolved) return [];

    if (currentUser) {
      // User is logged in, show all user links
      return BASE_USER_NAV_LINKS.map(link => {
        if (link.key === 'user-nav-profile') { // Check by key
          return { ...link, href: '/profile', label: 'პროფილი', icon: User };
        }
        return link;
      });
    } else {
      // User is not logged in, show only Login link
      const loginLinkTemplate = BASE_USER_NAV_LINKS.find(link => link.key === 'user-nav-profile');
      if (loginLinkTemplate) {
        return [{ ...loginLinkTemplate, key: 'user-nav-login', href: '/login', label: 'შესვლა', icon: User }];
      }
      // Fallback in case template is not found (should not happen with current constants)
      return [{ key: 'user-nav-login-fallback', href: '/login', label: 'შესვლა', icon: User }];
    }
  };

  const userNavLinksToRender = getProcessedUserNavLinks();

  const renderRegularLink = (link: NavLink, isUserNavLinkMobile: boolean = false) => {
    const IconComponent = link.icon;
    const isFavoritesLink = link.href === '/favorites';
    const isCartLink = link.href === '/cart';

    const shouldShowFavoritesDot = isUserNavLinkMobile && isFavoritesLink && favoritesStoreInitialized && favoriteItems.length > 0 && currentUser;
    const shouldShowCartCount = isUserNavLinkMobile && isCartLink && isCartInitialized && totalCartItems > 0;

    return (
      <Link
        key={link.key || link.href}
        href={link.href}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary relative',
          pathname === link.href ? 'text-primary' : 'text-foreground/70',
          isMobile && 'block px-4 py-2 text-base'
        )}
        onClick={onLinkClick}
        aria-current={pathname === link.href ? 'page' : undefined}
      >
        {IconComponent && (
          <span className={cn("inline-flex items-center relative", isMobile ? "mr-2" : "")}>
            <IconComponent className={cn("inline-block", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            {shouldShowFavoritesDot && (
              <span className="absolute top-[-2px] right-[-2px] block h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background"></span>
            )}
            {shouldShowCartCount && ( // Ensure this logic only applies when relevant
              <Badge variant="destructive" className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs leading-none flex items-center justify-center">
                 {totalCartItems > 9 ? '9+' : totalCartItems}
              </Badge>
            )}
          </span>
        )}
        {link.label}
      </Link>
    );
  };

  const renderUserIconLink = (link: NavLink) => {
    const IconComponent = link.icon;
    const isFavoritesLink = link.href === '/favorites';
    const isCartLink = link.href === '/cart';
    const keyForLink = link.key || link.href;

    const shouldShowFavoritesDotDesktop = !isMobile && isFavoritesLink && favoritesStoreInitialized && favoriteItems.length > 0 && currentUser;
    const shouldShowCartCountDesktop = !isMobile && isCartLink && isCartInitialized && totalCartItems > 0;

    return (
      <Button
        key={keyForLink}
        variant="ghost"
        size="icon"
        asChild
        className={cn(
          'transition-colors hover:text-primary relative',
          pathname === link.href ? 'text-primary' : 'text-foreground/70',
        )}
        onClick={() => {
          if (onLinkClick) { // This prop is for mobile sheet close
            onLinkClick();
          }

          if (link.icon === User) { // Check if this is the User (profile/login) icon
            const currentTime = Date.now();
            let newClickCount;

            if (profileClickCount === 0 || currentTime - lastProfileClickTime > CLICK_TIMEOUT_MS) {
              // First click in a sequence or sequence timed out
              newClickCount = 1;
            } else {
              // Subsequent click in a sequence
              newClickCount = profileClickCount + 1;
            }

            setProfileClickCount(newClickCount);
            setLastProfileClickTime(currentTime);

            if (newClickCount === ADMIN_CLICKS_TARGET) {
              // Target reached
              if (typeof window !== "undefined") {
                window.open('/admin', '_blank');
              }
              // Reset counter after opening
              setProfileClickCount(0);
              setLastProfileClickTime(0);
            }
          }
        }}
        aria-label={link.label}
      >
        <Link href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>
          {IconComponent && (
            <span className="relative">
              <IconComponent className="h-5 w-5" />
              {shouldShowFavoritesDotDesktop && (
                <span className="absolute top-[-4px] right-[-4px] block h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background"></span>
              )}
              {shouldShowCartCountDesktop && (
                <Badge variant="destructive" className="absolute top-[-6px] right-[-8px] h-4 min-w-[1rem] px-1 text-xs leading-none flex items-center justify-center">
                  {totalCartItems > 9 ? '9+' : totalCartItems}
                </Badge>
              )}
            </span>
          )}
          <span className="sr-only">{link.label}</span>
        </Link>
      </Button>
    );
  };

  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-1 pt-4">
        {BASE_NAV_LINKS.map(link => renderRegularLink(link, false))}
        <hr className="my-2 border-border" />
        {authResolved && userNavLinksToRender.map(link => renderRegularLink(link, true))}
      </nav>
    );
  }

  return (
    <>
      <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {BASE_NAV_LINKS.map(link => renderRegularLink(link, false))}
      </nav>
      <div className="hidden md:flex items-center space-x-2">
        {authResolved && userNavLinksToRender.map(renderUserIconLink)}
      </div>
    </>
  );
}
