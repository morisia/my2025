
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Users, BarChart3, Settings, ShoppingBasket, AlertTriangle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

async function getProductCount(): Promise<number | null> {
  try {
    const productsCollection = collection(db, 'products');
    const snapshot = await getCountFromServer(productsCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching product count:", error);
    return null;
  }
}

async function getUserCount(): Promise<number | null> {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching user count:", error);
    return null;
  }
}

async function getOrderCount(): Promise<number | null> {
  try {
    // Assuming your orders are stored in a collection named 'orders'
    const ordersCollection = collection(db, 'orders'); 
    const snapshot = await getCountFromServer(ordersCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching order count:", error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const productCount = await getProductCount();
  const userCount = await getUserCount();
  const orderCount = await getOrderCount();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">ადმინისტრატორის დაფა</h1>
        <p className="text-muted-foreground">კეთილი იყოს თქვენი მობრძანება მართვის პანელში.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ პროდუქტები</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productCount !== null ? (
              <div className="text-2xl font-bold">{productCount.toLocaleString()}</div>
            ) : (
              <div className="text-sm text-destructive flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4" /> რაოდენობის ჩატვირთვა ვერ მოხერხდა
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              ხელმისაწვდომია კატალოგში
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href="/admin/products">პროდუქტების მართვა</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">მომხმარებლები</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {userCount !== null ? (
              <div className="text-2xl font-bold">{userCount.toLocaleString()}</div>
            ) : (
              <div className="text-sm text-destructive flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4" /> რაოდენობის ჩატვირთვა ვერ მოხერხდა
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              რეგისტრირებულია სისტემაში
            </p>
             <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href="/admin/users">მომხმარებლების ნახვა</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">შეკვეთები</CardTitle>
            <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {orderCount !== null ? (
              <div className="text-2xl font-bold">{orderCount.toLocaleString()}</div>
            ) : (
               <div className="text-sm text-destructive flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4" /> რაოდენობის ჩატვირთვა ვერ მოხერხდა
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              +19% გასული თვიდან (სატესტო)
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href="/admin/orders">შეკვეთების ნახვა</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ანალიტიკა</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">იხილეთ</div>
            <p className="text-xs text-muted-foreground">
              საიტის სტატისტიკა
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
               <Link href="/admin/analytics">ანალიტიკის ნახვა</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>სწრაფი მოქმედებები</CardTitle>
          <CardDescription>ხშირად გამოყენებული ფუნქციები.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/admin/products/add">
              <Package className="mr-2 h-4 w-4" /> ახალი პროდუქტის დამატება
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" /> საიტის პარამეტრები
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
