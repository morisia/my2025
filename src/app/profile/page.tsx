
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Edit3, Package, ShieldCheck, LogOut, Loader2, Home, CreditCard, ShoppingBag } from "lucide-react";
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, Timestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { AdminPanelOrder, OrderStatus, UserProfileData as UserProfileFirestoreData } from '@/lib/types'; 

interface UserProfileData extends UserProfileFirestoreData {}


// Helper functions for status badge styling (copied from admin orders)
const getStatusVariant = (status?: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  switch (status.toLowerCase()) {
    case "pending":
    case "processing":
      return "secondary";
    case "shipped":
    case "delivered":
      return "default";
    case "cancelled":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusClassName = (status?: OrderStatus): string => {
  if (!status) return "border-gray-500/30 text-gray-700 hover:bg-gray-500/10";
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30";
    case "processing":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30 hover:bg-sky-500/30";
    case "shipped":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30";
    case "delivered":
      return "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30";
    case "cancelled":
    case "refunded":
      return "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30";
    default:
      return "border-gray-500/30 text-gray-700 hover:bg-gray-500/10";
  }
};


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [userOrders, setUserOrders] = useState<AdminPanelOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true); 
      if (currentUser) {
        setFirebaseUser(currentUser);
        try {
          // Fetch user profile data
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserProfileData(userDocSnap.data() as UserProfileData);
            setError(null);
          } else {
            setError("პროფილის მონაცემები ვერ მოიძებნა.");
            setUserProfileData(null); 
            console.warn("No such document for user profile:", currentUser.uid);
          }

          // Fetch user orders
          setIsLoadingOrders(true);
          setOrdersError(null);
          const ordersCollectionRef = collection(db, 'orders');
          const q = query(ordersCollectionRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AdminPanelOrder));
          setUserOrders(fetchedOrders);

        } catch (err) {
          console.error("Error fetching user data or orders:", err);
          if (!userProfileData) setError("მონაცემების წამოღებისას მოხდა შეცდომა.");
          setOrdersError("შეკვეთების ჩატვირთვისას მოხდა შეცდომა.");
          setUserProfileData(null); 
          setUserOrders([]);
        } finally {
          setIsLoading(false); 
          setIsLoadingOrders(false);
        }
      } else {
        setFirebaseUser(null);
        setUserProfileData(null);
        setUserOrders([]);
        setError(null); 
        setOrdersError(null);
        setIsLoading(false);
        setIsLoadingOrders(false);
      }
    });

    return () => unsubscribe();
  }, []); 

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [isLoading, firebaseUser, router]);

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    }
    if (firstName) {
      return `${firstName[0] || ''}${firstName.length > 1 ? firstName[1] : ''}`.toUpperCase();
    }
    return "??";
  };

  const formatJoinDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return "თარიღი უცნობია";
    try {
      const date = timestamp.toDate();
      const monthNames = ["იანვარს", "თებერვალს", "მარტს", "აპრილს", "მაისს", "ივნისს", "ივლისს", "აგვისტოს", "სექტემბერს", "ოქტომბერს", "ნოემბერს", "დეკემბერს"];
      return `შემოგვიერთდა ${date.getFullYear()} წლის ${date.getDate()} ${monthNames[date.getMonth()]}`;
    } catch (formatError) {
      console.error("Error formatting date:", formatError);
      return "თარიღის ფორმატირების შეცდომა";
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await auth.signOut();
      toast({
        title: 'წარმატებით გამოხვედით',
        description: 'მალე გნახავთ!',
      });
    } catch (e) {
      console.error("Logout Error:", e);
      let errorMessage = "გამოსვლისას მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.";
      if (e instanceof Error) {
          errorMessage = `შეცდომა: ${e.message}`;
      }
      toast({
        title: 'გამოსვლის შეცდომა',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">იტვირთება პროფილი...</p>
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
  
  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="font-headline text-2xl font-bold text-destructive mb-2">შეცდომა</h1>
        <p className="text-lg text-foreground/80">{error}</p>
        <Button onClick={() => router.push('/')} className="mt-4">მთავარ გვერდზე</Button>
      </div>
    );
  }
  
  if (!userProfileData) {
    return (
      <div className="text-center py-12">
        <h1 className="font-headline text-2xl font-bold text-primary mb-2">პროფილის მონაცემები არასრულია</h1>
        <p className="text-lg text-foreground/80">თქვენი პროფილის დეტალები ვერ მოიძებნა. გთხოვთ, დაუკავშირდეთ მხარდაჭერას ან სცადოთ მოგვიანებით.</p>
        <Button onClick={() => router.refresh()} className="mt-4 mr-2">სცადეთ თავიდან</Button>
        <Button onClick={handleLogout} variant="outline" className="mt-4">გამოსვლა</Button>
      </div>
    );
  }

  const displayName = `${userProfileData.firstName} ${userProfileData.lastName}`;
  const displayEmail = userProfileData.email;
  const displayInitials = getInitials(userProfileData.firstName, userProfileData.lastName);
  const displayJoinDate = formatJoinDate(userProfileData.createdAt);
  const displayAvatarUrl = userProfileData.avatarUrl || `https://placehold.co/100x100.png?text=${displayInitials}`;
  
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-headline text-4xl font-bold text-primary mb-2">ჩემი პროფილი</h1>
        <p className="text-lg text-foreground/80">მართეთ თქვენი ანგარიშის დეტალები და იხილეთ შეკვეთების ისტორია.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
              <AvatarImage src={displayAvatarUrl} alt={displayName} data-ai-hint="profile avatar" />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary">{displayInitials}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-2xl">{displayName}</CardTitle>
            <CardDescription>{displayEmail}</CardDescription>
            <CardDescription className="text-xs">{displayJoinDate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/profile/edit')}
            >
              <Edit3 className="mr-2 h-4 w-4" /> პროფილის რედაქტირება
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/profile/change-password')}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> პაროლის შეცვლა
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={isLoading && firebaseUser !== null}>
              {isLoading && firebaseUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              გამოსვლა
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" /> შეკვეთების ისტორია
            </CardTitle>
            <CardDescription>იხილეთ თქვენი წინა შენაძენები.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrders && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">შეკვეთები იტვირთება...</p>
              </div>
            )}
            {!isLoadingOrders && ordersError && (
              <div className="text-center py-6 text-destructive">
                <p>{ordersError}</p>
              </div>
            )}
            {!isLoadingOrders && !ordersError && userOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2" />
                <p>თქვენ ჯერ არ გაქვთ შეკვეთები.</p>
                <Button variant="link" asChild className="mt-2 text-primary">
                  <Link href="/catalog">შოპინგის დაწყება</Link>
                </Button>
              </div>
            )}
            {!isLoadingOrders && !ordersError && userOrders.length > 0 && (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg bg-muted/30 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <h4 className="font-semibold text-foreground">შეკვეთა #{order.id.substring(0, 8)}...</h4>
                      <span className="text-xs text-muted-foreground">
                        {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                        <p className="text-muted-foreground">სულ: <span className="font-medium text-foreground">L{order.totalAmount.toFixed(2)}</span></p>
                        <p className="text-muted-foreground">{order.products.reduce((sum, p) => sum + p.quantity, 0)} ნივთი</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant={getStatusVariant(order.status)} className={getStatusClassName(order.status)}>
                        {order.status}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        asChild 
                        className="p-0 h-auto text-primary text-xs"
                      >
                        <Link href={`/profile/orders/${order.id}`}>დეტალების ნახვა</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                 {userOrders.length > 3 && ( 
                    <div className="text-center mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => toast({title: "ყველა შეკვეთის ნახვა", description: "მომხმარებლისთვის ყველა შეკვეთის ნახვის გვერდი მალე დაემატება."})}
                        >
                            ყველა შეკვეთის ნახვა
                        </Button>
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                   <Home className="mr-2 h-5 w-5 text-primary" /> შენახული მისამართები
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                  {userProfileData?.addressCity ? `თქვენი შენახული ქალაქია: ${userProfileData.addressCity}${userProfileData.postalCode ? `, ${userProfileData.postalCode}` : ''}` : 'თქვენ არ გაქვთ შენახული მისამართები.'}
                </p>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/profile/edit')}
                >
                    {userProfileData?.addressCity ? 'მისამართის რედაქტირება' : 'მისამართის დამატება'}
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                   <CreditCard className="mr-2 h-5 w-5 text-primary" /> გადახდის მეთოდები
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">თქვენ არ გაქვთ შენახული გადახდის მეთოდები.</p>
                 <Button 
                    variant="outline" 
                    onClick={() => toast({title: "გადახდის მეთოდის დამატება", description: "ეს ფუნქცია მალე დაემატება."})}
                >
                    გადახდის მეთოდის დამატება
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

