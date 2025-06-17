
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, CreditCard, FileText, Package as PackageIcon, CalendarDays, Phone, Loader2, AlertTriangle, Edit, Truck, ShoppingBasket, Save } from "lucide-react";
import type { AdminPanelOrder, OrderProductItem, OrderStatus } from '@/lib/types';
import { Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { APP_NAME } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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

const orderStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<AdminPanelOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!orderId) {
        setError("შეკვეთის ID არ არის მითითებული.");
        setIsLoading(false);
        return;
    };

    const fetchOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const orderDocRef = doc(db, 'orders', orderId);
            const orderDocSnap = await getDoc(orderDocRef);

            if (orderDocSnap.exists()) {
                const fetchedOrder = { id: orderDocSnap.id, ...orderDocSnap.data() } as AdminPanelOrder;
                setOrder(fetchedOrder);
                setSelectedStatus(fetchedOrder.status);
            } else {
                setError(`შეკვეთა ID-ით "${orderId}" ვერ მოიძებნა.`);
            }
        } catch (err) {
            console.error("Error fetching order:", err);
            setError("შეკვეთის მონაცემების ჩატვირთვისას მოხდა შეცდომა.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) {
      toast({
        title: "არაფერი შეცვლილა",
        description: "სტატუსი იგივეა ან არ არის არჩეული.",
        variant: "default",
      });
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        status: selectedStatus,
        updatedAt: Timestamp.now(),
      });
      setOrder(prevOrder => prevOrder ? { ...prevOrder, status: selectedStatus, updatedAt: Timestamp.now() } : null);
      toast({
        title: "სტატუსი განახლდა!",
        description: `შეკვეთის სტატუსი შეიცვალა ${selectedStatus}-ზე.`,
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      toast({
        title: "სტატუსის განახლების შეცდომა",
        description: "სტატუსის განახლებისას მოხდა შეცდომა.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const orderCreationDate = order?.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const handlePrintInvoice = () => {
    if (!order) return;

    const invoiceHtml = `
      <html>
      <head>
        <title>ინვოისი #${order.id.substring(0,8)}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'DejaVu Sans', 'PT Sans', sans-serif; margin: 20px; color: #333; line-height: 1.6; }
          .container { width: 100%; max-width: 800px; margin: auto; padding: 15px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0 0 5px 0; color: #333; font-size: 24px; }
          .header h2 { margin: 0; font-size: 18px; color: #555; font-weight: normal;}
          .details table, .items table, .totals table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .details th, .details td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
          .details th { font-weight: bold; width: 180px; color: #444; }
          .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
          .items th { background-color: #f9f9f9; font-weight: bold; }
          .items .text-right, .totals .text-right { text-align: right; }
          .items .variant-info { font-size: 0.9em; color: #555; }
          .totals table { width: 60%; margin-left: auto; font-size: 14px; }
          .totals td:first-child { font-weight: bold; color: #555;}
          .totals .grand-total td { font-weight: bold; font-size: 1.3em; color: #333; border-top: 2px solid #333; padding-top: 10px;}
          .footer { text-align: center; margin-top: 40px; font-size: 0.9em; color: #777; }
          .address-block { white-space: pre-line; }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .container { width: 100%; box-shadow: none; border: none; margin: 0; padding:0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
            <h2>ინვოისი / Invoice</h2>
          </div>
          <div class="details">
            <table>
              <tr><th>შეკვეთის ID:</th><td>#${order.id}</td></tr>
              <tr><th>შეკვეთის თარიღი:</th><td>${orderCreationDate}</td></tr>
              <tr><th>მომხმარებელი:</th><td>${order.customerName}</td></tr>
              <tr><th>ელ.ფოსტა:</th><td>${order.customerEmail}</td></tr>
              ${order.customerPhone ? `<tr><th>ტელეფონი:</th><td>${order.customerPhone}</td></tr>` : ''}
              <tr>
                <th>მიწოდების მისამართი:</th>
                <td class="address-block">
                  ${order.shippingAddress.addressLine1 || ''}
                  ${order.shippingAddress.addressLine2 ? `\n${order.shippingAddress.addressLine2}` : ''}
                  \n${order.shippingAddress.city}, ${order.shippingAddress.postalCode}
                  \n${order.shippingAddress.country}
                </td>
              </tr>
              ${order.paymentMethod ? `<tr><th>გადახდის მეთოდი:</th><td>${order.paymentMethod}</td></tr>` : ''}
              ${order.transactionId ? `<tr><th>ტრანზაქციის ID:</th><td>${order.transactionId}</td></tr>` : ''}
            </table>
          </div>
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>პროდუქტი</th>
                  <th>რაოდ.</th>
                  <th>ერთეულის ფასი</th>
                  <th class="text-right">ჯამი</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(item => `
                  <tr>
                    <td>
                      ${item.name}
                      ${item.selectedSize || item.selectedColor ? `<div class="variant-info">` : ''}
                      ${item.selectedSize ? `ზომა: ${item.selectedSize}` : ''}
                      ${item.selectedSize && item.selectedColor ? ' | ' : ''}
                      ${item.selectedColor ? `ფერი: ${item.selectedColor}` : ''}
                      ${item.selectedSize || item.selectedColor ? `</div>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>L${item.price.toFixed(2)}</td>
                    <td class="text-right">L${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="totals">
            <table>
              <tr><td>შუალედური ჯამი:</td><td class="text-right">L${order.subtotal.toFixed(2)}</td></tr>
              <tr><td>მიწოდება:</td><td class="text-right">L${order.shippingCost.toFixed(2)}</td></tr>
              <tr class="grand-total"><td>სულ:</td><td class="text-right">L${order.totalAmount.toFixed(2)}</td></tr>
            </table>
          </div>
          ${order.notes ? `<div class="notes" style="margin-top: 20px; padding: 10px; border-top: 1px solid #eee;"><h4>შენიშვნები:</h4><p style="white-space: pre-line;">${order.notes}</p></div>` : ''}
          <div class="footer">
            <p>გმადლობთ შეკვეთისთვის!</p>
            <p>${APP_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      toast({
        title: "ბეჭდვის შეცდომა",
        description: "ვერ მოხერხდა ბეჭდვის ფანჯრის გახსნა. გთხოვთ, შეამოწმოთ ბრაუზერის pop-up ბლოკერი.",
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">შეკვეთის დეტალები იტვირთება...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-4">შეცდომა</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> შეკვეთების სიაში დაბრუნება
        </Button>
      </div>
    );
  }

  if (!order) {
     return (
      <div className="text-center py-12">
        <PackageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-4">შეკვეთა ვერ მოიძებნა</h1>
         <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> შეკვეთების სიაში დაბრუნება
        </Button>
      </div>
    );
  }


  const orderUpdateDate = order.updatedAt instanceof Timestamp ? order.updatedAt.toDate().toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (order.updatedAt ? String(order.updatedAt) : 'N/A');


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">შეკვეთის დეტალები: #{order.id.substring(0,8)}...</h1>
          <p className="text-muted-foreground">შექმნის თარიღი: {orderCreationDate}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> უკან შეკვეთებთან
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><PackageIcon className="mr-2 h-5 w-5 text-primary" /> შეკვეთის ინფორმაცია</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">შეკვეთის ID:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">მიმდინარე სტატუსი:</span>
                <Badge variant={getStatusVariant(order.status)} className={getStatusClassName(order.status)}>{order.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">განახლდა:</span>
                <span className="font-medium">{orderUpdateDate}</span>
              </div>
               {order.paymentMethod && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">გადახდის მეთოდი:</span>
                    <span className="font-medium">{order.paymentMethod}</span>
                </div>
                )}
                {order.transactionId && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">ტრანზაქციის ID:</span>
                    <span className="font-medium">{order.transactionId}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-3 border-t pt-4">
                <Label htmlFor="status-select" className="text-sm font-medium">სტატუსის განახლება:</Label>
                <div className="flex w-full gap-2">
                    <Select
                        value={selectedStatus}
                        onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
                        name="status-select"
                        aria-labelledby="status-select-label"

                    >
                        <SelectTrigger id="status-select" className="flex-grow">
                        <SelectValue placeholder="აირჩიეთ სტატუსი" />
                        </SelectTrigger>
                        <SelectContent>
                        {orderStatuses.map(statusOption => (
                            <SelectItem key={statusOption} value={statusOption}>
                            {statusOption}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleUpdateStatus}
                        disabled={isUpdatingStatus || selectedStatus === order.status}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                        {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        შენახვა
                    </Button>
                </div>
            </CardFooter>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><ShoppingBasket className="mr-2 h-5 w-5 text-primary" /> შეკვეთილი ნივთები ({order.products.reduce((sum, p) => sum + p.quantity, 0)})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] hidden sm:table-cell">სურათი</TableHead>
                    <TableHead>დასახელება</TableHead>
                    <TableHead className="text-center">რაოდ.</TableHead>
                    <TableHead className="text-right">ფასი</TableHead>
                    <TableHead className="text-right">ჯამი</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products.map((item, index) => (
                    <TableRow key={item.productId || `product-${index}`}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          src={item.imageUrl || `https://placehold.co/64x80.png?text=${item.name[0]}`}
                          alt={item.name}
                          width={64}
                          height={80}
                          className="rounded-md object-cover"
                          data-ai-hint={item.dataAiHint || "product"}
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={item.slug ? `/catalog/${item.slug}` : '#'} className="font-medium hover:text-primary">{item.name}</Link>
                         {(item.selectedSize || item.selectedColor) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.selectedSize && <span>ზომა: {item.selectedSize}</span>}
                            {item.selectedSize && item.selectedColor && <span className="mx-1">|</span>}
                            {item.selectedColor && <span>ფერი: {item.selectedColor}</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">L{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">L{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            {order.notes && (
            <Card className="shadow-sm">
                <CardHeader>
                <CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> შეკვეთის შენიშვნები</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{order.notes}</p>
                </CardContent>
            </Card>
            )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><User className="mr-2 h-5 w-5 text-primary" /> მომხმარებლის ინფორმაცია</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              {order.customerPhone && <p className="text-sm text-muted-foreground flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5"/>{order.customerPhone}</p>}
               {order.userId && <p className="text-xs text-muted-foreground">User ID: {order.userId}</p>}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><MapPin className="mr-2 h-5 w-5 text-primary" /> მიწოდების მისამართი</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.shippingAddress.addressLine1 || 'მისამართი არ არის მითითებული'}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm sticky top-24">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><CreditCard className="mr-2 h-5 w-5 text-primary" /> შეკვეთის ჯამი</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">შუალედური ჯამი:</span>
                    <span>L{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">მიწოდება:</span>
                    <span>L{order.shippingCost.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                    <span>სულ:</span>
                    <span className="text-primary">L${order.totalAmount.toFixed(2)}</span>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={handlePrintInvoice}>
                  <FileText className="mr-2 h-4 w-4" /> ინვოისის ამობეჭდვა
                </Button>
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
