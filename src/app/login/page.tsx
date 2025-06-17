
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'შესვლა',
  description: `შედით თქვენს ანგარიშზე ${APP_NAME}-ში.`,
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary mb-2">სისტემაში შესვლა</h1>
          <p className="text-lg text-foreground/80">
            შეიყვანეთ თქვენი მონაცემები არსებულ ანგარიშზე წვდომისთვის.
          </p>
        </header>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          არ გაქვთ ანგარიში?{' '}
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href="/register">რეგისტრაცია</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
