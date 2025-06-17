import { AiStylistForm } from '@/components/ai-stylist-form';
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'AI სტილისტი',
  description: `მიიღეთ AI-ზე დაფუძნებული მოდის რჩევები ტრადიციული ქართული ტანსაცმლისთვის ${APP_NAME}-სგან.`,
};

export default function AiStylistPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">AI მოდის სტილისტი</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          აღმოაჩინეთ სრულყოფილი ქართული ანსამბლი. ჩვენი AI სტილისტი გთავაზობთ პერსონალიზებულ რეკომენდაციებს თქვენი უპირატესობებისა და ტრადიციული ესთეტიკის საფუძველზე.
        </p>
      </header>
      
      <AiStylistForm />
    </div>
  );
}
