
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const registerFormSchema = z.object({
  firstName: z.string().min(2, { message: 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  lastName: z.string().min(2, { message: 'გვარი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  email: z.string().email({ message: 'გთხოვთ, შეიყვანოთ სწორი ელ. ფოსტის მისამართი.' }),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, { message: 'პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან.' }),
  confirmPassword: z.string().min(6, { message: 'პაროლის გამეორება სავალდებულოა.' }),
  gender: z.enum(['male', 'female'], { required_error: 'სქესის მითითება სავალდებულოა.' }),
  addressCity: z.string().min(2, { message: 'ქალაქი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  postalCode: z.string().min(4, { message: 'საფოსტო ინდექსი უნდა შედგებოდეს მინიმუმ 4 ციფრისგან.' }),
  acceptTerms: z.boolean().refine(val => val === true, { message: 'წესებსა და პირობებზე დათანხმება სავალდებულოა.' }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, { message: 'კონფიდენციალურობის პოლიტიკაზე დათანხმება სავალდებულოა.' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "პაროლები არ ემთხვევა.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter(); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      addressCity: '',
      postalCode: '',
      acceptTerms: false,
      acceptPrivacyPolicy: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    let userCredential; 
    try {
      userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        gender: data.gender,
        addressCity: data.addressCity,
        postalCode: data.postalCode,
        createdAt: Timestamp.now(),
      });

      router.push('/login'); // გადამისამართება ჯერ
      form.reset(); // შემდეგ ფორმის გასუფთავება
      toast({ // და ბოლოს შეტყობინება
        title: 'რეგისტრაცია წარმატებულია!',
        description: 'ახლა შეგიძლიათ შეხვიდეთ თქვენი ანგარიშით. გადამისამართება შესვლის გვერდზე...',
      });
      
    } catch (error: unknown) {
      let errorMessage = 'რეგისტრაციისას მოხდა შეცდომა. გთხოვთ, სცადოთ ხელახლა.';
      if (error instanceof Error) {
        const firebaseError = error as { code?: string; message: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'ეს ელ. ფოსტა უკვე გამოყენებულია. სცადეთ სხვა.';
            break;
          case 'auth/weak-password':
            errorMessage = 'პაროლი ძალიან სუსტია. გთხოვთ, გამოიყენოთ მინიმუმ 6 სიმბოლო.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'ელ. ფოსტის ფორმატი არასწორია.';
            break;
          default:
            if (firebaseError.code && firebaseError.code.startsWith('permission-denied')) {
                 errorMessage = 'მონაცემთა ბაზაში ჩაწერის შეცდომა: არასაკმარისი უფლებები.';
            } else if (userCredential && userCredential.user && error.message.includes('firestore')) {
                 errorMessage = `ანგარიში შეიქმნა, მაგრამ დამატებითი მონაცემების შენახვა ვერ მოხერხდა: ${error.message}`;
            } else {
                 errorMessage = `Firebase შეცდომა: ${firebaseError.message}`;
            }
        }
      } else {
         errorMessage = String(error);
      }
      console.error('Registration error:', error);
      toast({
        title: 'რეგისტრაციის შეცდომა',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">ანგარიშის შექმნა</CardTitle>
        <CardDescription>შეავსეთ ქვემოთ მოცემული ველები თქვენი ანგარიშის შესაქმნელად.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="firstName">სახელი</FormLabel>
                    <FormControl>
                      <Input id="firstName" placeholder="თქვენი სახელი" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="lastName">გვარი</FormLabel>
                    <FormControl>
                      <Input id="lastName" placeholder="თქვენი გვარი" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">ელ. ფოსტა</FormLabel>
                  <FormControl>
                    <Input id="email" type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="phoneNumber">ტელეფონის ნომერი (არასავალდებულო)</FormLabel>
                  <FormControl>
                    <Input id="phoneNumber" type="tel" placeholder="+995 555 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">პაროლი</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">გაიმეორეთ პაროლი</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>სქესი</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-x-4 md:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="male" id="gender-male" />
                        </FormControl>
                        <FormLabel htmlFor="gender-male" className="font-normal">კაცი</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" id="gender-female" />
                        </FormControl>
                        <FormLabel htmlFor="gender-female" className="font-normal">ქალი</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="addressCity">ქალაქი</FormLabel>
                  <FormControl>
                    <Input id="addressCity" placeholder="თქვენი ქალაქი" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="postalCode">საფოსტო ინდექსი</FormLabel>
                  <FormControl>
                    <Input id="postalCode" placeholder="მაგ: 0100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="acceptTerms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="acceptTerms" className="font-normal">
                      ვეთანხმები{' '}
                      <Link href="/terms" className="underline hover:text-primary transition-colors">
                        წესებსა და პირობებს
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptPrivacyPolicy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="acceptPrivacyPolicy"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="acceptPrivacyPolicy" className="font-normal">
                      ვეთანხმები{' '}
                      <Link href="/privacy" className="underline hover:text-primary transition-colors">
                        კონფიდენციალურობის პოლიტიკას
                      </Link>
                    </FormLabel>
                     <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  რეგისტრაცია...
                </>
              ) : (
                'რეგისტრაცია'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
    
