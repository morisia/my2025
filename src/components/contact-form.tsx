
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  email: z.string().email({ message: 'გთხოვთ, შეიყვანოთ სწორი ელ. ფოსტის მისამართი.' }),
  subject: z.string().min(5, { message: 'სათაური უნდა შედგებოდეს მინიმუმ 5 სიმბოლოსგან.' }),
  message: z.string().min(10, { message: 'შეტყობინება უნდა შედგებოდეს მინიმუმ 10 სიმბოლოსგან.' }).max(500, {message: 'შეტყობინება არ უნდა აღემატებოდეს 500 სიმბოლოს.'}),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; message: string }> {
  console.log('საკონტაქტო ფორმა გაიგზავნა:', data);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: 'თქვენი შეტყობინება წარმატებით გაიგზავნა!' };
}


export function ContactForm() {
  const { toast } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const result = await submitContactForm(data); 
      if (result.success) {
        toast({
          title: 'შეტყობინება გაიგზავნა!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: 'შეცდომა',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: 'მოხდა მოულოდნელი შეცდომა. გთხოვთ, სცადოთ ხელახლა.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">მოგვწერეთ შეტყობინება</CardTitle>
        <CardDescription>ჩვენ დაგიკავშირდებით რაც შეიძლება მალე.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>სრული სახელი</FormLabel>
                  <FormControl>
                    <Input placeholder="თქვენი სახელი" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ელ. ფოსტის მისამართი</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>სათაური</FormLabel>
                  <FormControl>
                    <Input placeholder="შესახებ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>შეტყობინება</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="თქვენი შეტყობინება..." 
                      className="h-12" 
                      rows={1}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                'იგზავნება...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> გაგზავნა
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    