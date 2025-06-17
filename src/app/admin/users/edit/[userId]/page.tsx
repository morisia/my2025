
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft, UserCog } from 'lucide-react'; 
import Link from 'next/link';

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
import type { AdminPanelUser } from '@/lib/types';

const adminEditUserFormSchema = z.object({
  firstName: z.string().min(2, { message: 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  lastName: z.string().min(2, { message: 'გვარი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  phoneNumber: z.string().optional()
    .refine(val => !val || /^\+?[0-9\s-()]{7,20}$/.test(val), {
      message: "ტელეფონის ნომრის ფორმატი არასწორია.",
    }).or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  addressCity: z.string().min(2, { message: 'ქალაქი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }).optional().or(z.literal('')),
  postalCode: z.string().min(4, { message: 'საფოსტო ინდექსი უნდა შედგებოდეს მინიმუმ 4 სიმბოლოსგან.' }).optional().or(z.literal('')),
  avatarUrl: z.string().url({ message: 'გთხოვთ, შეიყვანოთ სწორი URL მისამართი ავატარისთვის.' }).optional().or(z.literal('')),
});

type AdminEditUserFormValues = z.infer<typeof adminEditUserFormSchema>;

interface UserFirestoreDataForAdminEdit extends Omit<AdminPanelUser, 'firebaseId' | 'createdAt' | 'email'> {
  email: string; // Keep email to read, but it won't be part of the form values to be submitted for update
  createdAt?: Timestamp; 
}


export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [userInitialEmail, setUserInitialEmail] = useState(''); 

  const form = useForm<AdminEditUserFormValues>({
    resolver: zodResolver(adminEditUserFormSchema),
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
    if (!userId) {
        setUserNotFound(true);
        setIsFetching(false);
        return;
    }
    const fetchUser = async () => {
      setIsFetching(true);
      try {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserFirestoreDataForAdminEdit;
          setUserInitialEmail(userData.email || 'ელ.ფოსტა არ მოიძებნა');
          form.reset({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phoneNumber: userData.phoneNumber || '',
            gender: userData.gender || undefined,
            addressCity: userData.addressCity || '',
            postalCode: userData.postalCode || '',
            avatarUrl: userData.avatarUrl || '',
          });
        } else {
          setUserNotFound(true);
          toast({
            title: 'მომხმარებელი ვერ მოიძებნა',
            description: `მომხმარებელი ID-ით ${userId} ვერ მოიძებნა.`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching user for admin edit:', error);
        toast({
          title: 'მომხმარებლის ჩატვირთვის შეცდომა',
          description: 'მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.',
          variant: 'destructive',
        });
        setUserNotFound(true); 
      } finally {
        setIsFetching(false);
      }
    };
    fetchUser();
  }, [userId, form, toast]);

   useEffect(() => {
    document.title = `მომხმარებლის რედაქტირება | ${APP_NAME}`;
  }, []);


  async function onSubmit(data: AdminEditUserFormValues) {
    if (userNotFound || !userId) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      
      const updateData: Partial<Omit<UserFirestoreDataForAdminEdit, 'email' | 'createdAt'>> = {
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
        title: 'მომხმარებელი წარმატებით განახლდა!',
        description: `${data.firstName} ${data.lastName}-ის მონაცემები განახლდა.`,
      });
      router.push('/admin/users');
    } catch (error) {
      console.error('Error updating user by admin:', error);
      toast({
        title: 'მომხმარებლის განახლების შეცდომა',
        description: 'მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">მომხმარებლის მონაცემები იტვირთება...</p>
      </div>
    );
  }

  if (userNotFound) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive mb-4">მომხმარებელი ვერ მოიძებნა</h1>
        <p className="text-muted-foreground mb-6">
          მოთხოვნილი მომხმარებელი არ არსებობს.
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> მომხმარებლების სია
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center"><UserCog className="mr-3 h-8 w-8" /> მომხმარებლის რედაქტირება</h1>
          <p className="text-muted-foreground">შეცვალეთ მომხმარებლის მონაცემები ქვემოთ.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> უკან მომხმარებლებთან
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>პირადი ინფორმაცია</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="firstName">სახელი</FormLabel>
                      <FormControl>
                        <Input id="firstName" placeholder="მომხმარებლის სახელი" {...field} />
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
                        <Input id="lastName" placeholder="მომხმარებლის გვარი" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="email">ელ. ფოსტა (არ რედაქტირდება ადმინის მიერ)</FormLabel>
                    <FormControl>
                    <Input id="email" type="email" value={userInitialEmail} disabled readOnly />
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
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>მისამართი და ავატარი</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="addressCity">ქალაქი</FormLabel>
                      <FormControl>
                        <Input id="addressCity" placeholder="მომხმარებლის ქალაქი" {...field} />
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
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="avatarUrl">ავატარის URL</FormLabel>
                      <FormControl>
                        <Input id="avatarUrl" type="url" placeholder="https://example.com/avatar.png" {...field} />
                      </FormControl>
                       <FormDescription>მომხმარებლის ავატარის სურათის სრული URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
          
          <CardFooter className="flex justify-end gap-2 border-t pt-6 mt-8">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} disabled={isSubmitting}>
              გაუქმება
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || isFetching}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              ცვლილებების შენახვა
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
