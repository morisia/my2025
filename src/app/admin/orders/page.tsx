
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Search, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link"; 
import { useState, useEffect } from "react";
import type { AdminPanelOrder, OrderStatus } from "@/lib/types"; 
import { Timestamp, collection, getDocs, query, orderBy as firestoreOrderBy } from "firebase/firestore"; 
import { db } from "@/lib/firebase";

const getStatusVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
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

const getStatusClassName = (status: OrderStatus): string => {
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
}


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminPanelOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ordersCollectionRef = collection(db, 'orders');
        const q = query(ordersCollectionRef, firestoreOrderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AdminPanelOrder));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("შეკვეთების ჩატვირთვისას მოხდა შეცდომა.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">შეკვეთები იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">შეკვეთების მართვა</h1>
          <p className="text-muted-foreground">დაათვალიერეთ და მართეთ თქვენი მაღაზიის შეკვეთები.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>შეკვეთების სია</CardTitle>
          <CardDescription>
            ყველა შემოსული შეკვეთა თქვენს სისტემაში.
          </CardDescription>
          <div className="pt-4 flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="შეკვეთების ძიება (ID, მომხმარებელი, იმეილი)..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" /> ექსპორტი (მალე)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
             <div className="flex flex-col items-center justify-center py-10 text-destructive">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p className="text-lg font-semibold">შეცდომა!</p>
                <p>{error}</p>
             </div>
          )}
          {!error && orders.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBasket className="h-12 w-12 mx-auto mb-2" />
              <p>შეკვეთები ვერ მოიძებნა.</p>
              <p className="text-sm">სისტემაში ჯერ არ არის არც ერთი შეკვეთა.</p>
            </div>
          )}
          {!error && orders.length > 0 && filteredOrders.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2" />
                <p>თქვენი ძიების შესაბამისი შეკვეთა ვერ მოიძებნა.</p>
            </div>
          )}
          
          {!error && filteredOrders.length > 0 && !isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">შეკვეთის ID</TableHead>
                  <TableHead>მომხმარებელი</TableHead>
                  <TableHead>თარიღი</TableHead>
                  <TableHead>სტატუსი</TableHead>
                  <TableHead className="text-right">სულ (L)</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">ნივთები</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">მოქმედებები</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString('ka-GE', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className={getStatusClassName(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">L{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{order.products.reduce((sum, p) => sum + p.quantity, 0)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" asChild>
                         <Link href={`/admin/orders/${order.id}`}>დეტალები</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
