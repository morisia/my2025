
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'ჩვენ შესახებ',
  description: `შეიტყვეთ მეტი ${APP_NAME}-ის ისტორიის, მისიისა და ფასეულობების შესახებ.`,
};

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">ჩვენ შესახებ</h1>
        <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
          კეთილი იყოს თქვენი მობრძანება ${APP_NAME}-ში, სადაც ქართული ტრადიციები და თანამედროვე სტილი ერთმანეთს ერწყმის.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="prose lg:prose-xl max-w-none">
          <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">ჩვენი მისია</h2>
          <p>
            ჩვენი მისიაა, შევინარჩუნოთ და გავაცოცხლოთ ქართული ტრადიციული სამოსის უნიკალური მემკვიდრეობა,
            შევთავაზოთ რა მომხმარებელს მაღალი ხარისხის, ავთენტური და ამავდროულად თანამედროვე ელემენტებით გამდიდრებული ტანსაცმელი.
            ჩვენ გვჯერა, რომ ტრადიცია ცოცხალია და ის მუდმივად უნდა ვითარდებოდეს.
          </p>
          <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">ჩვენი ფასეულობები</h2>
          <ul>
            <li><strong>ავთენტურობა:</strong> ჩვენ ვიყენებთ ტრადიციულ მეთოდებსა და მასალებს, რათა თითოეული ნივთი იყოს უნიკალური.</li>
            <li><strong>ხარისხი:</strong> ჩვენ ვზრუნავთ დეტალებზე და ვირჩევთ საუკეთესო ქსოვილებსა და აქსესუარებს.</li>
            <li><strong>ინოვაცია:</strong> ჩვენ ვცდილობთ, ტრადიციული დიზაინი შევუხამოთ თანამედროვე ტენდენციებს.</li>
            <li><strong>პატივისცემა:</strong> ჩვენ პატივს ვცემთ ქართულ კულტურას, ჩვენს ხელოსნებსა და ჩვენს მომხმარებლებს.</li>
          </ul>
        </div>
        <div className="relative aspect-square rounded-lg overflow-hidden shadow-xl bg-muted">
          <Image
            src="https://placehold.co/600x600.png"
            alt="ქართული ტრადიციული ორნამენტები"
            fill
            className="object-cover"
            data-ai-hint="georgian ornament"
          />
        </div>
      </section>

      <section className="text-center bg-card p-8 rounded-lg shadow-md">
        <h2 className="font-headline text-2xl font-semibold text-primary mb-4">გუნდი ჩვენს უკან</h2>
        <p className="text-foreground/80 max-w-2xl mx-auto mb-6">
          ${APP_NAME}-ს გუნდი შედგება თავისი საქმის პროფესიონალებისგან, რომლებსაც აერთიანებთ ქართული კულტურის სიყვარული და მისი პოპულარიზაციის სურვილი.
          ჩვენ ვამაყობთ, რომ გვაქვს შესაძლებლობა, შევქმნათ რაღაც ღირებული და გავუზიაროთ ის მსოფლიოს.
        </p>
        <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden shadow-lg bg-muted">
           <Image
            src="https://placehold.co/800x450.png"
            alt="თბილისი სთაილს გუნდი"
            fill
            className="object-cover"
            data-ai-hint="team working"
          />
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground text-center">
        გმადლობთ, რომ დაინტერესდით ${APP_NAME}-ით.
      </p>
    </div>
  );
}
