import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      {/* You can replace this with an SVG or Image component if you have a graphical logo */}
      {/* For example: <Image src="/logo.svg" alt={APP_NAME} width={40} height={40} /> */}
      <span className="font-headline text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
        {APP_NAME}
      </span>
    </Link>
  );
}
