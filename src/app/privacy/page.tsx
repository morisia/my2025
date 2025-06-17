
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'კონფიდენციალურობის პოლიტიკა',
  description: `გაეცანით ${APP_NAME}-ის კონფიდენციალურობის პოლიტიკას.`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">კონფიდენციალურობის პოლიტიკა</h1>
      </header>
      <div className="prose lg:prose-xl max-w-none mx-auto">
        <p>
          {APP_NAME} იღებს ვალდებულებას, დაიცვას თქვენი კონფიდენციალურობა. ეს კონფიდენციალურობის პოლიტიკა განმარტავს, თუ როგორ ვაგროვებთ, ვიყენებთ, ვამჟღავნებთ და ვიცავთ თქვენს ინფორმაციას, როდესაც თქვენ სტუმრობთ ჩვენს ვებსაიტს.
        </p>
        <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">1. ინფორმაციის შეგროვება</h2>
        <p>
          ჩვენ შეიძლება შევაგროვოთ პირადად საიდენტიფიკაციო ინფორმაცია, როგორიცაა თქვენი სახელი, ელექტრონული ფოსტის მისამართი, საფოსტო მისამართი, ტელეფონის ნომერი და სხვა ინფორმაცია, რომელსაც თქვენ ნებაყოფლობით გვაწვდით.
        </p>
        <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">2. ინფორმაციის გამოყენება</h2>
        <p>
          თქვენგან შეგროვებული ინფორმაცია შეიძლება გამოყენებულ იქნას შემდეგი მიზნებისთვის:
        </p>
        <ul>
          <li>თქვენი გამოცდილების პერსონალიზაცია</li>
          <li>ჩვენი ვებსაიტის გაუმჯობესება</li>
          <li>მომხმარებელთა მომსახურების გაუმჯობესება</li>
          <li>ტრანზაქციების დამუშავება</li>
          <li>პერიოდული ელ.წერილების გაგზავნა</li>
        </ul>
        {/* დაამატეთ მეტი სექციები საჭიროებისამებრ */}
        <p className="mt-8 text-sm text-muted-foreground">
          ბოლოს განახლდა: [თარიღი]
        </p>
      </div>
    </div>
  );
}

    