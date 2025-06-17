
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/hooks/use-cart-store';
import type { CartItem as CartItemType, OrderProductItem, ShippingAddress, AdminPanelOrder, SiteSettings } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';
import { Loader2, ShoppingBasket, CreditCard, PackageCheck, ArrowLeft, Landmark } from 'lucide-react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { initiateTbcPayment } from '@/ai/flows/initiate-tbc-payment-flow';

const checkoutFormSchema = z.object({
  firstName: z.string().min(2, { message: 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  lastName: z.string().min(2, { message: 'გვარი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  email: z.string().email({ message: 'გთხოვთ, შეიყვანოთ სწორი ელ. ფოსტის მისამართი.' }),
  phoneNumber: z.string().min(9, { message: 'ტელეფონის ნომერი უნდა შედგებოდეს მინიმუმ 9 ციფრისგან.' })
    .regex(/^\+?[0-9\s-()]{7,20}$/, { message: "ტელეფონის ნომრის ფორმატი არასწორია." })
    .optional().or(z.literal('')),
  address: z.string().min(10, { message: 'მისამართი (ქუჩა, სახლი) უნდა შედგებოდეს მინიმუმ 10 სიმბოლოსგან, თუ მითითებულია.' }).optional().or(z.literal('')),
  city: z.string().min(2, { message: 'ქალაქი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.' }),
  postalCode: z.string().min(4, { message: 'საფოსტო ინდექსი უნდა შედგებოდეს მინიმუმ 4 სიმბოლოსგან.' }),
  notes: z.string().max(200, {message: 'შენიშვნა არ უნდა აღემატებოდეს 200 სიმბოლოს.'}).optional(),
  paymentMethod: z.string().min(1, { message: "გადახდის მეთოდის არჩევა სავალდებულოა."}),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface UserProfileFirestoreData {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  addressCity?: string | null;
  postalCode?: string | null;
}

interface SitePaymentSettings {
  paypalEnabled: boolean;
  stripeEnabled: boolean;
  tbcPayEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
}


export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cartItems, getCartSubtotal, isCartInitialized, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [sitePaymentSettings, setSitePaymentSettings] = useState<SitePaymentSettings>({
    paypalEnabled: false,
    stripeEnabled: false,
    tbcPayEnabled: false,
    cashOnDeliveryEnabled: true, // Default true, will be overridden
  });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
      paymentMethod: 'cash_on_delivery', 
    },
  });

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const settingsDocRef = doc(db, "siteConfiguration", "main");
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          setSitePaymentSettings({
            paypalEnabled: data.paypalEnabled || false,
            stripeEnabled: data.stripeEnabled || false,
            tbcPayEnabled: data.tbcPayEnabled || false,
            cashOnDeliveryEnabled: data.cashOnDeliveryEnabled === undefined ? true : data.cashOnDeliveryEnabled,
          });
        }
      } catch (error) {
        console.error("Error fetching site payment settings:", error);
      }
    };
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          const baseValues: Partial<CheckoutFormValues> = { email: currentUser.email || '', paymentMethod: 'cash_on_delivery' };

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfileFirestoreData;
            form.reset({
              ...baseValues,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              phoneNumber: data.phoneNumber || '',
              city: data.addressCity || '',
              postalCode: data.postalCode || '',
              address: '', 
              notes: '',
            });
          } else {
             form.reset(baseValues);
          }
        } catch (error) {
          console.error("Error fetching user data for checkout:", error);
          toast({
            title: "მონაცემების ჩატვირთვის შეცდომა",
            description: "პროფილის მონაცემების წამოღება ვერ მოხერხდა.",
            variant: "destructive",
          });
           if (currentUser.email) {
             form.reset({ email: currentUser.email, paymentMethod: 'cash_on_delivery' });
           }
        }
      } else {
         form.reset({ paymentMethod: 'cash_on_delivery' });
      }
      setIsUserDataLoading(false);
    });
    return () => unsubscribe();
  }, [form, toast]);


  useEffect(() => {
    if (!isUserDataLoading && isCartInitialized && cartItems.length === 0) {
      toast({
        title: 'თქვენი კალათა ცარიელია',
        description: 'გადახდის გასაგრძელებლად, გთხოვთ, დაამატოთ ნივთები კალათაში.',
        variant: 'destructive',
      });
      router.push('/catalog');
    }
  }, [isUserDataLoading, isCartInitialized, cartItems, router, toast]);

  const cartSubtotal = getCartSubtotal();
  const shippingCost = cartSubtotal > 0 ? 15 : 0;
  const serviceFeePercentage = 0.01;
  const serviceFee = cartSubtotal > 0 ? cartSubtotal * serviceFeePercentage : 0;
  const cartTotal = cartSubtotal + shippingCost + serviceFee;

  async function onSubmit(data: CheckoutFormValues) {
    if (!firebaseUser && data.paymentMethod !== 'cash_on_delivery_guest' && data.paymentMethod === 'cash_on_delivery' && !sitePaymentSettings.cashOnDeliveryEnabled) {
        // This specific combination for guest checkout with COD might need adjustment if COD is globally disabled
        // For now, assuming if COD is disabled, a guest cannot use it anyway.
    }
    
    if (!firebaseUser && data.paymentMethod !== 'cash_on_delivery') {
      // Guest trying to use a non-COD method or a disabled COD
      // More refined logic might be needed if "cash_on_delivery_guest" was a distinct value.
      // For now, if they are not a firebaseUser, and they selected TBC or another method, block.
      // If they selected COD, and COD is disabled, it also should be blocked.
      if (data.paymentMethod === 'cash_on_delivery' && !sitePaymentSettings.cashOnDeliveryEnabled) {
         toast({
            title: "გადახდის მეთოდი მიუწვდომელია",
            description: "კურიერთან გადახდა ამჟამად გამორთულია.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
      }
      if (data.paymentMethod !== 'cash_on_delivery') {
          toast({
            title: "ავტორიზაცია საჭიროა",
            description: "ამ გადახდის მეთოდის გამოსაყენებლად, გთხოვთ, გაიაროთ ავტორიზაცია.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
      }
    }
    setIsLoading(true);

    const orderProducts: OrderProductItem[] = cartItems.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl || null,
      slug: item.slug || null,
      dataAiHint: item.dataAiHint || null,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    }));

    const shippingAddressPayload: ShippingAddress = {
      addressLine1: data.address || '',
      addressLine2: null, 
      city: data.city,
      postalCode: data.postalCode,
      country: "საქართველო",
    };

    const orderPayload: Omit<AdminPanelOrder, 'id'> = {
      userId: firebaseUser?.uid || undefined, 
      customerName: `${data.firstName} ${data.lastName}`,
      customerEmail: data.email,
      customerPhone: data.phoneNumber || null,
      status: data.paymentMethod === 'tbc_pay' ? 'Pending Payment' : 'Pending',
      products: orderProducts,
      shippingAddress: shippingAddressPayload,
      subtotal: cartSubtotal,
      shippingCost: shippingCost,
      totalAmount: cartTotal,
      notes: data.notes || null,
      paymentMethod: data.paymentMethod,
      transactionId: null, 
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      if (data.paymentMethod === 'tbc_pay') {
        const orderDocRef = await addDoc(collection(db, 'orders'), orderPayload);
        const newOrderId = orderDocRef.id;

        toast({
          title: 'შეკვეთა მიღებულია',
          description: 'მიმდინარეობს TBC Pay-სთან დაკავშირება...',
        });

        const tbcResponse = await initiateTbcPayment({ 
          orderId: newOrderId, 
          amount: cartTotal, 
          currency: 'GEL' 
        });

        if (tbcResponse && tbcResponse.redirectUrl) {
          toast({
            title: 'გადამისამართება TBC Pay-ზე',
            description: 'თქვენ მალე გადამისამართდებით TBC Pay-ს გვერდზე. ეს არის სიმულაცია.',
            duration: 7000,
          });
          clearCart();
          window.location.href = tbcResponse.redirectUrl; 
        } else {
          throw new Error('TBC Pay-ს გადამისამართების URL ვერ მივიღეთ.');
        }
      } else { 
        await addDoc(collection(db, 'orders'), orderPayload);
        toast({
          title: 'შეკვეთა წარმატებით განთავსდა!',
          description: 'მადლობას გიხდით შენაძენისთვის. ჩვენი წარმომადგენელი მალე დაგიკავშირდებათ.',
          duration: 7000,
          action: (
            <Button onClick={() => router.push('/profile')} variant="outline">
              პროფილის ნახვა
            </Button>
          )
        });
        clearCart();
        router.push('/catalog');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'შეკვეთის განთავსების შეცდომა',
        description: `შეკვეთის მონაცემების დამუშავებისას მოხდა შეცდომა. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }


  if (!isCartInitialized || isUserDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">იტვირთება გადახდის გვერდი...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <ShoppingBasket className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-2">თქვენი კალათა ცარიელია</h1>
        <p className="text-muted-foreground mb-6">გთხოვთ, დაამატოთ პროდუქტები კალათაში გასაგრძელებლად.</p>
        <Button asChild>
          <Link href="/catalog">კატალოგში დაბრუნება</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">შეკვეთის გაფორმება</h1>
        <p className="text-lg text-foreground/80">გთხოვთ, შეავსოთ თქვენი მიწოდების და გადახდის ინფორმაცია.</p>
      </header>

      <Button variant="outline" onClick={() => router.push('/cart')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> კალათაში დაბრუნება
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-2 space-y-8">
            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
              <AccordionItem value="item-1">
                <Card className="shadow-lg">
                  <AccordionTrigger>
                    <CardHeader className="w-full flex-row justify-between items-center">
                      <div>
                        <CardTitle className="font-headline text-2xl text-primary">მიწოდების ინფორმაცია</CardTitle>
                        {firebaseUser && (
                          <CardDescription className="text-sm text-muted-foreground mt-1">გადაამოწმე მიწოდების ინფორმაცია</CardDescription>
                        )}
                      </div>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="address">მისამართი (ქუჩა, სახლი) (არასავალდებულო)</FormLabel>
                            <FormControl>
                              <Input id="address" placeholder="ქუჩა, სახლის ნომერი, ბინა" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor="city">ქალაქი</FormLabel>
                              <FormControl>
                                <Input id="city" placeholder="მაგ: თბილისი" {...field} />
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
                      </div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="notes">დამატებითი შენიშვნები (არასავალდებულო)</FormLabel>
                            <FormControl>
                              <Textarea
                                id="notes"
                                placeholder="მაგ: გთხოვთ, დარეკოთ მოსვლამდე."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center">
                    <CreditCard className="mr-2 h-6 w-6" /> გადახდის მეთოდი
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            {sitePaymentSettings.cashOnDeliveryEnabled && (
                              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <FormControl>
                                  <RadioGroupItem value="cash_on_delivery" id="payment-cod" />
                                </FormControl>
                                <FormLabel htmlFor="payment-cod" className="font-normal cursor-pointer flex-grow">
                                  გადახდა კურიერთან
                                </FormLabel>
                              </FormItem>
                            )}
                            {sitePaymentSettings.tbcPayEnabled && (
                               <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <FormControl>
                                  <RadioGroupItem value="tbc_pay" id="payment-tbc" />
                                </FormControl>
                                <FormLabel htmlFor="payment-tbc" className="font-normal cursor-pointer flex-grow flex items-center">
                                  <Landmark className="mr-2 h-5 w-5 text-blue-600" /> TBC Pay-ით გადახდა
                                </FormLabel>
                              </FormItem>
                            )}
                             {sitePaymentSettings.paypalEnabled && (
                               <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 opacity-50 cursor-not-allowed">
                                <FormControl>
                                  <RadioGroupItem value="paypal" id="payment-paypal" disabled />
                                </FormControl>
                                <FormLabel htmlFor="payment-paypal" className="font-normal cursor-not-allowed flex-grow flex items-center">
                                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 fill-[#0070BA]"><title>PayPal</title><path d="M7.335 2.408H2.887a.154.154 0 0 0-.154.153v.002c.008.09.071.15.157.15H7.34c2.622 0 4.121 1.134 4.058 3.328-.038 1.266-.707 2.01-1.823 2.516-.934.407-1.344.665-1.344 1.067 0 .24.161.432.511.432H10.99c2.775 0 4.274-1.138 4.336-3.36.065-2.004-1.285-3.205-3.96-3.205zm11.063 16.247c.264.829-.27 1.075-.894.813-.623-.263-1.003-.55-1.266-.813l-3.022-8.673h2.109l.707 2.093.203.639c.127.407.263.766.407 1.068h.048c.08-.23.184-.51.279-.828l.312-.928.29-.87L18.11 8.02h2.015l-3.726 10.635zM9.04 8.131h2.601c.248 0 .365-.078.432-.287.134-.407.079-2.812-.002-3.113a.432.432 0 0 0-.43-.33H5.062l-2.063 5.972h2.273c.23 0 .398-.113.493-.357l.072-.21.805-2.352c.096-.264.23-.639.297-.915zm-2.295 5.114h2.919c.212 0 .366-.079.44-.312l.297-.915.04-.113.031-.094.008-.023c.087-.264.162-.51.222-.766h.039c.096.264.184.51.263.766l.365 1.086h2.149l-3.022-8.673h-2.046l-2.4 6.951H2.94l-1.336 3.859h2.242l.631-1.815.072-.21c.096-.264.24-.639.32-.915z"/></svg>
                                  PayPal (მალე)
                                </FormLabel>
                              </FormItem>
                            )}
                            {sitePaymentSettings.stripeEnabled && (
                                <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 opacity-50 cursor-not-allowed">
                                <FormControl>
                                  <RadioGroupItem value="stripe" id="payment-stripe" disabled />
                                </FormControl>
                                <FormLabel htmlFor="payment-stripe" className="font-normal cursor-not-allowed flex-grow flex items-center">
                                 <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 fill-[#635BFF]"><title>Stripe</title><path d="M18.221.953c.473-.263.707-.066.473.398L14.25 10.4h4.487c.407 0 .602.23.432.568L10.22 22.61c-.24.494-.707.187-.407-.331l4.487-9.053H9.698c-.407 0-.602-.23-.432-.568L18.221.953z"/></svg>
                                  Stripe (ბარათით, მალე)
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <p className="text-xs text-muted-foreground pt-2">
                   სხვა გადახდის მეთოდები (მაგ: ადგილობრივი ბანკები) მალე დაემატება.
                 </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || isUserDataLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    მუშავდება...
                  </>
                ) : (
                  <>
                    <PackageCheck className="mr-2 h-5 w-5" /> შეკვეთის განთავსება
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <Card className="lg:col-span-1 sticky top-24 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">შეკვეთის შეჯამება</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item: CartItemType) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <Image
                  src={item.imageUrl || `https://placehold.co/60x80.png?text=${item.name[0]}`}
                  alt={item.name}
                  width={60}
                  height={80}
                  className="rounded-md object-cover aspect-[3/4]"
                  data-ai-hint={item.dataAiHint || "product image"}
                />
                <div className="flex-grow">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  {item.selectedSize && <p className="text-xs text-muted-foreground">ზომა: {item.selectedSize}</p>}
                  {item.selectedColor && <p className="text-xs text-muted-foreground">ფერი: {item.selectedColor}</p>}
                  <p className="text-xs text-muted-foreground">რაოდ: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">L{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">შუალედური ჯამი</span>
              <span className="font-medium text-foreground">L{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">მიწოდება</span>
              <span className="font-medium text-foreground">L{shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">მომსახურების მოსაკრებელი (1%)</span>
              <span className="font-medium text-foreground">L{serviceFee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-foreground">სულ</span>
              <span className="text-primary">L{cartTotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground">
                "შეკვეთის განთავსება" ღილაკზე დაჭერით თქვენ ეთანხმებით ჩვენს {' '}
                <Link href="/terms" className="underline hover:text-primary">წესებსა და პირობებს</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function CheckoutPageMetadata() {
  return {
    title: `შეკვეთის გაფორმება | ${APP_NAME}`,
    description: `დაასრულეთ თქვენი შენაძენი ${APP_NAME}-ში. შეიყვანეთ მიწოდების და გადახდის დეტალები.`,
  };
}
