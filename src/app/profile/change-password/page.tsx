
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "მიმდინარე პაროლის შეყვანა სავალდებულოა." }),
  newPassword: z.string().min(6, { message: "ახალი პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან." }),
  confirmNewPassword: z.string().min(6, { message: "პაროლის გამეორება სავალდებულოა." }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "ახალი პაროლები არ ემთხვევა.",
  path: ["confirmNewPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        router.push('/login');
      }
      setInitialAuthCheckDone(true);
    });
    return () => unsubscribe();
  }, [router]);
  
  useEffect(() => {
    document.title = `პაროლის შეცვლა | ${APP_NAME}`;
  }, []);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: "შეცდომა", description: "მომხმარებელი არ არის ავტორიზებული ან იმეილი არ მოიძებნა.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      
      await updatePassword(firebaseUser, data.newPassword);
      
      toast({
        title: "წარმატება!",
        description: "თქვენი პაროლი წარმატებით შეიცვალა.",
      });
      form.reset();
      router.push('/profile');
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "პაროლის შეცვლისას მოხდა შეცდომა.";
      if (error.code) {
        switch (error.code) {
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "მიმდინარე პაროლი არასწორია.";
            break;
          case 'auth/weak-password':
            errorMessage = "ახალი პაროლი ძალიან სუსტია. გთხოვთ, გამოიყენოთ მინიმუმ 6 სიმბოლო.";
            break;
          case 'auth/requires-recent-login':
             errorMessage = "ეს ოპერაცია მგრძნობიარეა და მოითხოვს ბოლო ავტორიზაციას. გთხოვთ, ხელახლა გაიაროთ ავტორიზაცია და სცადოთ ისევ.";
            break;
          default:
            errorMessage = `შეცდომა: ${error.message}`;
        }
      }
      toast({
        title: "პაროლის შეცვლის შეცდომა",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialAuthCheckDone) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">იტვირთება...</p>
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
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
             <ShieldCheck className="mr-2 h-6 w-6" /> პაროლის შეცვლა
          </CardTitle>
          <CardDescription>შეიყვანეთ თქვენი მიმდინარე და ახალი პაროლი.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="currentPassword">მიმდინარე პაროლი</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label={showCurrentPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">ახალი პაროლი</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmNewPassword">გაიმეორეთ ახალი პაროლი</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Input
                          id="confirmNewPassword"
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          aria-label={showConfirmNewPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                        >
                          {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-0 pt-6">
                 <Button type="button" variant="outline" onClick={() => router.push('/profile')} disabled={isLoading}>
                   <ArrowLeft className="mr-2 h-4 w-4" /> პროფილზე დაბრუნება
                </Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  პაროლის შეცვლა
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
