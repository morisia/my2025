'use client';

import { useState } from 'react';
import { Logo } from '@/components/logo';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-[10%]">
        <Logo />
        
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <MainNav />
        </div>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="მენიუს გახსნა">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-background p-6">
              <SheetTitle className="sr-only">მობილური მენიუ</SheetTitle>
              <SheetDescription className="sr-only">ნავიგაციის მენიუ მობილური მოწყობილობებისთვის</SheetDescription>
              <div className="flex justify-between items-center mb-6">
                <Logo />
              </div>
              <MainNav isMobile onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
