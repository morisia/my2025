
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // For redirection

const loginFormSchema = z.object({
  email: z.string().email({ message: 'გთხოვთ, შეიყვანოთ სწორი ელ. ფოსტის მისამართი.' }),
  password: z.string().min(1, { message: 'პაროლის შეყვანა სავალდებულოა.' }), // Min 1 for login, registration might have stricter rules
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'ავტორიზაცია წარმატებულია!',
        description: 'კეთილი იყოს თქვენი მობრძანება.',
      });
      form.reset();
      // Optionally redirect the user after successful login
      router.push('/'); // Redirect to homepage or dashboard
    } catch (error: unknown) {
      let errorMessage = 'ავტორიზაციისას მოხდა შეცდომა. გთხოვთ, სცადოთ ხელახლა.';
      if (error instanceof Error) {
        const firebaseError = error as { code?: string; message: string };
        switch (firebaseError.code) {
          case 'auth/invalid-email':
            errorMessage = 'ელ. ფოსტის ფორმატი არასწორია.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'ელ. ფოსტა ან პაროლი არასწორია.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'წვდომა დროებით დაბლოკილია ძალიან ბევრი მცდელობის გამო. სცადეთ მოგვიანებით.';
            break;
          default:
            errorMessage = `ავტორიზაციის შეცდომა: ${firebaseError.message}`;
        }
      } else {
         errorMessage = String(error);
      }
      console.error('Login error:', error);
      toast({
        title: 'ავტორიზაციის შეცდომა',
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
        <CardTitle className="font-headline text-xl text-primary">ანგარიშზე შესვლა</CardTitle>
        <CardDescription>შეიყვანეთ თქვენი ელფოსტა და პაროლი.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="login-email">ელ. ფოსტა</FormLabel>
                  <FormControl>
                    <Input id="login-email" type="email" placeholder="your.email@example.com" {...field} />
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
                  <FormLabel htmlFor="login-password">პაროლი</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="login-password"
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

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  შესვლა...
                </>
              ) : (
                'შესვლა'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
