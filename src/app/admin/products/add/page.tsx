
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Define the Zod schema for product validation
const productFormSchema = z.object({
  name: z.string().min(3, { message: 'პროდუქტის სახელი უნდა შედგებოდეს მინიმუმ 3 სიმბოლოსგან.' }),
  description: z.string().min(10, { message: 'აღწერა უნდა შედგებოდეს მინიმუმ 10 სიმბოლოსგან.' }),
  price: z.coerce.number().positive({ message: 'ფასი უნდა იყოს დადებითი რიცხვი.' }),
  category: z.string().min(1, { message: 'მიუთითეთ კატეგორია.' }),
  gender: z.enum(['men', 'women', 'children'], {
    required_error: "აირჩიეთ პროდუქტის სქესი."
  }),
  sizes: z.string().min(1, {message: "მინიმუმ ერთი ზომა მიუთითეთ."}).transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0)),
  colors: z.string().min(1, {message: "მინიმუმ ერთი ფერი მიუთითეთ."}).transform(val => val.split(',').map(c => c.trim()).filter(c => c.length > 0)),
  slug: z.string().min(3, { message: 'Slug უნდა შედგებოდეს მინიმუმ 3 სიმბოლოსგან.' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug უნდა შეიცავდეს მხოლოდ ლათინურ პატარა ასოებს, ციფრებს და დეფისებს.' }),
  imageUrls: z.string().min(1, "მინიმუმ ერთი URL უნდა იყოს მითითებული.")
    .transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0))
    .pipe(z.array(z.string().url({ message: "თითოეული URL უნდა იყოს სწორი ფორმატის." })).min(1, "მინიმუმ ერთი სურათის URL არის საჭირო.")),
  stock: z.coerce.number().int().min(0, { message: "მარაგის რაოდენობა არ უნდა იყოს უარყოფითი."}).default(0),
  dataAiHint: z.string().optional().default(''),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  brandName: z.string().optional().default(''),
  averageRating: z.coerce.number().min(0).max(5).optional().default(0).describe('საშუალო შეფასება 0-დან 5-მდე.'),
  reviewCount: z.coerce.number().int().min(0).optional().default(0).describe('შეფასებების რაოდენობა.'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AdminAddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined, 
      category: '',
      gender: undefined,
      sizes: [], 
      colors: [], 
      slug: '',
      imageUrls: [],
      stock: 0,
      dataAiHint: '',
      discountPercentage: 0,
      brandName: '',
      averageRating: 0,
      reviewCount: 0,
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    try {
      const productData = {
        ...data,
        price: Number(data.price), 
        stock: Number(data.stock),
        discountPercentage: data.discountPercentage ? Number(data.discountPercentage) : 0, 
        averageRating: data.averageRating ? Number(data.averageRating) : 0,
        reviewCount: data.reviewCount ? Number(data.reviewCount) : 0,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'products'), productData);

      toast({
        title: 'პროდუქტი წარმატებით დაემატა!',
        description: `${data.name} დაემატა თქვენს კატალოგს.`,
      });
      form.reset(); 
      router.push('/admin/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'პროდუქტის დამატების შეცდომა',
        description: 'მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">ახალი პროდუქტის დამატება</h1>
          <p className="text-muted-foreground">შეავსეთ ქვემოთ მოცემული ფორმა ახალი პროდუქტის დასამატებლად.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" /> უკან პროდუქტებთან
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ძირითადი ინფორმაცია</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>დასახელება</FormLabel>
                    <FormControl>
                      <Input placeholder="მაგ: ტრადიციული ჩოხა" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Slug (URL-ისთვის)</FormLabel>
                    <FormControl>
                      <Input placeholder="mag: tradiciuli-chokha" {...field} />
                    </FormControl>
                    <FormDescription>უნიკალური იდენტიფიკატორი URL-ში. გამოიყენეთ ლათინური პატარა ასოები, ციფრები და დეფისები.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>აღწერა</FormLabel>
                    <FormControl>
                      <Textarea placeholder="პროდუქტის დეტალური აღწერა" rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ფასი, მარაგი, კატეგორია და სქესი</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ფასი (L)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} step="0.01" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>მარაგის რაოდენობა</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} step="1" value={field.value ?? ''}/>
                    </FormControl>
                     <FormDescription>ხელმისაწვდომი ერთეულების რაოდენობა.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>კატეგორია</FormLabel>
                    <FormControl>
                      <Input placeholder="მაგ: ჩოხა, მაისური, ჯინსი" {...field} />
                    </FormControl>
                    <FormDescription>მიუთითეთ პროდუქტის კატეგორია.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ფასდაკლების პროცენტი (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} min="0" max="100" value={field.value ?? ''}/>
                    </FormControl>
                    <FormDescription>შეიყვანეთ რიცხვი 0-დან 100-მდე.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3 md:col-span-2">
                    <FormLabel>პროდუქტი განკუთვნილია</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="men" id="gender-men" />
                          </FormControl>
                          <FormLabel htmlFor="gender-men" className="font-normal">კაცისთვის</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="women" id="gender-women" />
                          </FormControl>
                          <FormLabel htmlFor="gender-women" className="font-normal">ქალისთვის</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="children" id="gender-children" />
                          </FormControl>
                          <FormLabel htmlFor="gender-children" className="font-normal">ბავშვისთვის</FormLabel>
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
              <CardTitle>ატრიბუტები და შეფასებები</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ზომები</FormLabel>
                    <FormControl>
                        <Input placeholder="S, M, L, XL (გამოყავით მძიმით)" 
                               value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                               onChange={(e) => field.onChange(e.target.value)}
                        />
                    </FormControl>
                    <FormDescription>მიუთითეთ ხელმისაწვდომი ზომები, გამოყოფილი მძიმით.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="colors"
                 render={({ field }) => (
                  <FormItem>
                    <FormLabel>ფერები</FormLabel>
                    <FormControl>
                      <Input placeholder="შავი, თეთრი, წითელი (გამოყავით მძიმით)" 
                             value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                             onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>მიუთითეთ ხელმისაწვდომი ფერები, გამოყოფილი მძიმით.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="averageRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>საშუალო შეფასება (0-5)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.0" {...field} step="0.1" min="0" max="5" value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>მიუთითეთ საშუალო შეფასება 0-დან 5-მდე.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reviewCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>შეფასებების რაოდენობა</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} step="1" min="0" value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>მიუთითეთ პროდუქტის შეფასებების ჯამური რაოდენობა.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>მედია და სხვა</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="imageUrls"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>სურათების URL-ები (მძიმით გამოყოფილი)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="https://example.com/image1.png, https://example.com/image2.png" 
                        rows={3}
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>შეიყვანეთ სურათების URL-ები, ერთმანეთისგან მძიმით გამოყოფილი. პირველი URL გამოყენებული იქნება მთავარ სურათად.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ბრენდის სახელი (არასავალდებულო)</FormLabel>
                    <FormControl>
                      <Input placeholder="მაგ: თბილისი სთაილს" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI მინიშნება სურათისთვის (არასავალდებულო)</FormLabel>
                    <FormControl>
                      <Input placeholder="მაგ: chokha man" {...field} />
                    </FormControl>
                    <FormDescription>მაქსიმუმ 2 საკვანძო სიტყვა.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <CardFooter className="flex justify-end gap-2 border-t pt-6 mt-8">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              გაუქმება
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              პროდუქტის შენახვა
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
