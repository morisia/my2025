
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'წესები და პირობები',
  description: `გაეცანით ${APP_NAME}-ის გამოყენების წესებსა და პირობებს.`,
};

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">წესები და პირობები</h1>
      </header>
      <div className="prose lg:prose-xl max-w-none mx-auto">
        <p>
          კეთილი იყოს თქვენი მობრძანება {APP_NAME}-ის წესებისა და პირობების გვერდზე.
        </p>
        <p>
          [აქ განათავსეთ თქვენი ვებსაიტის ან სერვისის გამოყენების წესები და პირობები.]
        </p>
        <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">1. შესავალი</h2>
        <p>
          ეს წესები და პირობები არეგულირებს თქვენს მიერ ჩვენი ვებსაიტის გამოყენებას. ჩვენი ვებსაიტის გამოყენებით, თქვენ სრულად ეთანხმებით ამ წესებსა და პირობებს. თუ არ ეთანხმებით ამ წესებსა და პირობებს ან მათ რომელიმე ნაწილს, არ უნდა გამოიყენოთ ჩვენი ვებსაიტი.
        </p>
        <h2 className="font-headline text-2xl font-semibold text-primary mt-6 mb-3">2. ინტელექტუალური საკუთრების უფლებები</h2>
        <p>
          თუ სხვაგვარად არ არის მითითებული, ჩვენ ან ჩვენი ლიცენზიარები ვფლობთ ინტელექტუალური საკუთრების უფლებებს ვებსაიტზე და ვებსაიტზე არსებულ მასალაზე. ყველა ეს ინტელექტუალური საკუთრების უფლება დაცულია.
        </p>
        {/* დაამატეთ მეტი სექციები საჭიროებისამებრ */}
        <p className="mt-8 text-sm text-muted-foreground">
          ბოლოს განახლდა: [თარიღი]
        </p>
      </div>
    </div>
  );
}

    