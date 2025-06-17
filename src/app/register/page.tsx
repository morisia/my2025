
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'რეგისტრაცია',
  description: `შექმენით ანგარიში ${APP_NAME}-ში ჩვენი დეტალური ფორმის გამოყენებით.`,
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="w-full max-w-md lg:max-w-lg space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary mb-2">ანგარიშის შექმნა</h1>
          <p className="text-lg text-foreground/80">
            შემოგვიერთდით და აღმოაჩინეთ ქართული ტრადიციული სამოსის სამყარო.
          </p>
        </header>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          უკვე გაქვთ ანგარიში?{' '}
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href="/login">შესვლა</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}

    