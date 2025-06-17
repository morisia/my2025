
'use client';

import { useState, useEffect } from 'react';
import { ContactForm } from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, Landmark, Loader2 } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';

interface ContactPageConfig {
  contactPageAddress?: string;
  contactPagePhone?: string;
  contactPageDisplayEmail?: string;
  contactPageWorkingHours?: string;
  contactPageBankAccount?: string;
}

async function fetchContactPageConfig(): Promise<ContactPageConfig | null> {
  try {
    const configDocRef = doc(db, 'siteConfiguration', 'main');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SiteSettings;
      return {
        contactPageAddress: data.contactPageAddress,
        contactPagePhone: data.contactPagePhone,
        contactPageDisplayEmail: data.contactPageDisplayEmail,
        contactPageWorkingHours: data.contactPageWorkingHours,
        contactPageBankAccount: data.contactPageBankAccount,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching contact page config:", error);
    return null;
  }
}

export default function ContactPage() {
  const [config, setConfig] = useState<ContactPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      const fetchedConfig = await fetchContactPageConfig();
      setConfig(fetchedConfig);
      setIsLoading(false);
    };
    loadConfig();
  }, []);

  const defaultAddress = "რუსთაველის გამზ. 123, თბილისი, საქართველო";
  const defaultPhone = "+995 32 212 3456";
  const defaultEmail = "info@tiflisistyles.com";
  const defaultWorkingHours = "ორშაბათი - პარასკევი: 9:00 - 18:00 (GET)\nშაბათი: 10:00 - 16:00 (GET)\nკვირა: დაკეტილია";

  const address = config?.contactPageAddress || defaultAddress;
  const phone = config?.contactPagePhone || defaultPhone;
  const email = config?.contactPageDisplayEmail || defaultEmail;
  const workingHours = config?.contactPageWorkingHours || defaultWorkingHours;
  const bankAccount = config?.contactPageBankAccount;

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">დაგვიკავშირდით</h1>
        <p className="text-lg text-foreground/80">მოხარული ვიქნებით მოვისმინოთ თქვენგან. დაგვიკავშირდით ნებისმიერი შეკითხვით ან მოთხოვნით.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">ჩვენი ინფორმაცია</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-accent mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">მისამართი</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-accent mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">ტელეფონი</h3>
                      <p className="text-muted-foreground">{phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-accent mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">ელ. ფოსტა</h3>
                      <p className="text-muted-foreground">{email}</p>
                    </div>
                  </div>
                  {bankAccount && (
                    <div className="flex items-start gap-4">
                      <Landmark className="h-6 w-6 text-accent mt-1 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground">საბანკო ანგარიში</h3>
                        <p className="text-muted-foreground">{bankAccount}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center">
                <Clock className="mr-2 h-5 w-5"/> სამუშაო საათები
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-line">
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                workingHours
              )}
            </CardContent>
          </Card>
        </div>

        <ContactForm />
      </div>
      
      <div className="mt-12">
          <h2 className="font-headline text-2xl text-center font-semibold text-primary mb-4">გვიპოვეთ რუკაზე</h2>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-md">
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2978.124420078088!2d44.79891861543001!3d41.71513797923458!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40440d700755126d%3A0x8f6c2c3b8e3f3e0b!2sRustaveli%20Ave%2C%20T'bilisi!5e0!3m2!1sen!2sge!4v1678886400000!5m2!1sen!2sge"
                width="100%"
                height="100%"
                style={{ border:0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="მაღაზიის მდებარეობა რუკაზე"
            ></iframe>
          </div>
      </div>
    </div>
  );
}

export function ContactPageMetadata() { // Keep this function as Next.js might expect it
  return {
    title: 'კონტაქტი',
    description: `დაგვიკავშირდით ${APP_NAME}-ში. ჩვენ მზად ვართ დაგეხმაროთ თქვენს შეკითხვებში ჩვენი ქართული ტრადიციული ტანსაცმლის შესახებ.`,
  };
}

    