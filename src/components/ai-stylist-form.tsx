
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
import { useToast } from '@/hooks/use-toast';
import { getStylistAdvice, type AiStylistAdviceInput, type AiStylistAdviceOutput } from '@/ai/flows/ai-stylist-advice';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';
import { SelectWithOptionalTextarea } from './select-with-optional-textarea';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const aiStylistFormSchema = z.object({
  clothingItem: z.string().min(3, { message: 'ტანსაცმლის ნივთი უნდა შედგებოდეს მინიმუმ 3 სიმბოლოსგან.' }),
  userStyle: z.string().min(5, { message: 'სტილის უპირატესობა უნდა შედგებოდეს მინიმუმ 5 სიმბოლოსგან.' }),
  occasion: z.string().min(3, { message: 'შემთხვევა უნდა შედგებოდეს მინიმუმ 3 სიმბოლოსგან.' }),
});

export type AiStylistFormValues = z.infer<typeof aiStylistFormSchema>;

// const clothingItemSuggestions = MOCK_CLOTHING_ITEMS.map(item => item.name).slice(0, 5); // Removed mock data
const occasionSuggestions = ["ქორწილი", "ოფიციალური ვახშამი", "ყოველდღიური გასვლა", "კულტურული ფესტივალი", "საქმიანი შეხვედრა"];
const styleSuggestions = ["კლასიკური ტრადიციული", "თანამედროვე ფიუჟენი", "ბოჰემური შიკი", "ელეგანტური ფორმალური", "ყოველდღიური"];

export function AiStylistForm() {
  const { toast } = useToast();
  const [advice, setAdvice] = useState<AiStylistAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const productsCollectionRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsCollectionRef);
        const categoriesSet = new Set<string>();
        querySnapshot.forEach((doc) => {
          const productData = doc.data();
          if (productData.category && typeof productData.category === 'string') {
            categoriesSet.add(productData.category);
          }
        });
        setFetchedCategories(Array.from(categoriesSet));
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: 'კატეგორიების ჩატვირთვის შეცდომა',
          description: 'სამწუხაროდ, კატეგორიების წამოღება ვერ მოხერხდა.',
          variant: 'destructive',
        });
        setFetchedCategories([]); // Fallback to empty or could use mock
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [toast]);

  const form = useForm<AiStylistFormValues>({
    resolver: zodResolver(aiStylistFormSchema),
    defaultValues: {
      clothingItem: '',
      userStyle: '',
      occasion: '',
    },
  });

  const onSubmit = async (data: AiStylistFormValues) => {
    setIsLoading(true);
    setAdvice(null);
    try {
      const result = await getStylistAdvice(data as AiStylistAdviceInput);
      setAdvice(result);
      toast({
        title: 'სტილისტის რჩევა მზადაა!',
        description: 'შეამოწმეთ რეკომენდაციები ქვემოთ.',
      });
    } catch (error) {
      console.error('AI სტილისტის შეცდომა:', error);
      toast({
        title: 'რჩევის მიღების შეცდომა',
        description: 'რაღაც არასწორად მოხდა. გთხოვთ, სცადოთ ხელახლა.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <Card className="md:col-span-1 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Wand2 className="mr-2 h-6 w-6" /> AI სტილისტი
          </CardTitle>
          <CardDescription>მიიღეთ პერსონალიზებული მოდის რჩევები თქვენი ქართული სამოსისთვის.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clothingItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ტანსაცმლის ნივთი/კატეგორია</FormLabel>
                    <FormControl>
                      <SelectWithOptionalTextarea
                        field={field}
                        options={isLoadingCategories ? [] : fetchedCategories}
                        selectPlaceholder={isLoadingCategories ? "იტვირთება კატეგორიები..." : "აირჩიეთ კატეგორია"}
                        textareaPlaceholder="მიუთითეთ ტანსაცმლის ნივთი"
                        disabled={isLoadingCategories}
                      />
                    </FormControl>
                    <FormDescription>რომელ ნივთს/კატეგორიას არჩევთ სტილისთვის?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userStyle"
                render={({ field }) => (
                   <FormItem>
                    <FormLabel>თქვენი სტილის უპირატესობა</FormLabel>
                    <FormControl>
                      <SelectWithOptionalTextarea
                        field={field}
                        options={styleSuggestions}
                        selectPlaceholder="მაგ., ტრადიციული, თანამედროვე, ყოველდღიური"
                        textareaPlaceholder="აღწერეთ თქვენი სტილი"
                      />
                    </FormControl>
                    <FormDescription>აღწერეთ თქვენი პირადი მოდის გემოვნება.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occasion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>შემთხვევა</FormLabel>
                    <FormControl>
                      <SelectWithOptionalTextarea
                        field={field}
                        options={occasionSuggestions}
                        selectPlaceholder="მაგ., ქორწილი, ფესტივალი, ყოველდღიური"
                        textareaPlaceholder="მიუთითეთ შემთხვევა"
                      />
                    </FormControl>
                    <FormDescription>სად ჩაიცვამთ ამ სამოსს?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || isLoadingCategories}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                რჩევის მიღება
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        {isLoading && (
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </CardContent>
          </Card>
        )}
        {advice && !isLoading && (
          <Card className="shadow-lg border-primary/50">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <Sparkles className="mr-2 h-6 w-6" /> თქვენი პერსონალიზებული რჩევა
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm sm:prose-base max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: advice.advice.replace(/\n/g, '<br />') }}
              />
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">AI-ს მიერ გენერირებული რჩევა. მნიშვნელოვანი ღონისძიებებისთვის გაითვალისწინეთ ადამიან სტილისტთან კონსულტაცია.</p>
            </CardFooter>
          </Card>
        )}
        {!advice && !isLoading && (
             <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed border-2">
                <Wand2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">მზად ხართ სტილის რჩევებისთვის?</h3>
                <p className="text-muted-foreground">შეავსეთ ფორმა, რომ მიიღოთ პერსონალიზებული რჩევები ჩვენი AI სტილისტისგან.</p>
            </Card>
        )}
      </div>
    </div>
  );
}
