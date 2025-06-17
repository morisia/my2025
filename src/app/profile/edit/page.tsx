
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';

// Firestore-დან წამოსული მონაცემების ტიპი
interface UserProfileFirestoreData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  gender?: 'male' | 'female' | null;
  addressCity?: string | null;
  postalCode?: string | null;
  createdAt: Timestamp; // ეს არ რედაქტირდება, მაგრამ შეიძლება წამოვიღოთ
  avatarUrl?: string | null;
}

// ფორმისთვის ვალიდაციის სქემა
const editProfileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  lastName: z.string().min(2, { message: 'გვარი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  // email: z.string().email(), // Email is not editable
  phoneNumber: z.string().optional()
    .refine(val => !val || /^\+?[0-9\s-()]{7,20}$/.test(val), {
      message: "ტელეფონის ნომრის ფორმატი არასწორია.",
    }).or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  addressCity: z.string().min(2, { message: 'ქალაქი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }).optional().or(z.literal('')),
  postalCode: z.string().min(4, { message: 'საფოსტო ინდექსი უნდა შედგებოდეს მინიმუმ 4 სიმბოლოსგან.' }).optional().or(z.literal('')),
  avatarUrl: z.string().url({ message: 'გთხოვთ, შეიყვანოთ სწორი URL მისამართი ავატარისთვის.' }).optional().or(z.literal('')),
});

type EditProfileFormValues = z.infer<typeof editProfileFormSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>('');

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      gender: undefined,
      addressCity: '',
      postalCode: '',
      avatarUrl: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        setCurrentEmail(currentUser.email || '');
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfileFirestoreData;
            form.reset({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              phoneNumber: data.phoneNumber || '',
              gender: data.gender || undefined,
              addressCity: data.addressCity || '',
              postalCode: data.postalCode || '',
              avatarUrl: data.avatarUrl || '',
            });
          } else {
            toast({
              title: "მონაცემების ჩატვირთვის შეცდომა",
              description: "პროფილის მონაცემები ვერ მოიძებნა.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching user data for edit:", error);
          toast({
            title: "შეცდომა",
            description: "მონაცემების წამოღებისას მოხდა შეცდომა.",
            variant: "destructive",
          });
        }
      } else {
        router.push('/login'); // Redirect if not logged in
      }
      setInitialDataLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast, form]);

  useEffect(() => {
    document.title = `პროფილის რედაქტირება | ${APP_NAME}`;
  }, []);

  const onSubmit = async (data: EditProfileFormValues) => {
    if (!firebaseUser) {
      toast({ title: "შეცდომა", description: "მომხმარებელი არ არის ავტორიზებული.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      // Prepare data for update, ensuring optional fields are handled
      const updateData: Partial<UserProfileFirestoreData> = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        gender: data.gender || null,
        addressCity: data.addressCity || null,
        postalCode: data.postalCode || null,
        avatarUrl: data.avatarUrl || null,
      };
      
      await updateDoc(userDocRef, updateData);
      toast({
        title: "წარმატება!",
        description: "თქვენი პროფილი წარმატებით განახლდა.",
      });
      router.push('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "პროფილის განახლების შეცდომა",
        description: "მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">იტვირთება ფორმა...</p>
      </div>
    );
  }
  
  if (!firebaseUser) {
     return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-4 text-lg text-muted-foreground">გადამისამართება...</p>
       </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">პროფილის რედაქტირება</CardTitle>
          <CardDescription>განაახლეთ თქვენი პირადი ინფორმაცია.</CardDescription>
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

              <FormItem>
                <FormLabel htmlFor="email">ელ. ფოსტა (არ რედაქტირდება)</FormLabel>
                <FormControl>
                  <Input id="email" type="email" value={currentEmail} disabled readOnly />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="phoneNumber">ტელეფონის ნომერი</FormLabel>
                    <FormControl>
                      <Input id="phoneNumber" placeholder="+995 555 123456" {...field} />
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
                        value={field.value}
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
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="avatarUrl">ავატარის URL</FormLabel>
                    <FormControl>
                      <Input id="avatarUrl" placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      მიუთითეთ თქვენი ავატარის სურათის სრული URL მისამართი.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-end gap-2 p-0 pt-6">
                 <Button type="button" variant="outline" onClick={() => router.push('/profile')} disabled={isSubmitting}>
                   <ArrowLeft className="mr-2 h-4 w-4" /> გაუქმება
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || initialDataLoading}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  შენახვა
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

