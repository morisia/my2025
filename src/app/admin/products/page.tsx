
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, FileText, Search, Loader2, AlertTriangle, Edit, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy as firestoreOrderBy, doc, deleteDoc } from 'firebase/firestore';
import type { ClothingItem } from '@/lib/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ProductWithId extends ClothingItem {
  firebaseId: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<'name' | 'price' | 'createdAt'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  
  const [productToDelete, setProductToDelete] = useState<ProductWithId | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productsCollection = collection(db, 'products');
        const q = query(productsCollection, firestoreOrderBy(orderBy, orderDirection));
        const productSnapshot = await getDocs(q);
        const productsList = productSnapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...(doc.data() as ClothingItem)
        }));
        setProducts(productsList);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("პროდუქტების ჩატვირთვისას მოხდა შეცდომა.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [orderBy, orderDirection]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const getProductStockStatus = (product: ProductWithId): { text: string; variant: "default" | "destructive" | "secondary"; className: string } => {
    if (product.stock > 0) {
        return { text: `მარაგშია (${product.stock})`, variant: "default" , className: "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30" };
    }
    return { text: "ამოწურულია", variant: "destructive" , className: "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30" };
  };

  const handleDeleteConfirmation = (product: ProductWithId) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsLoading(true); 
    try {
      await deleteDoc(doc(db, 'products', productToDelete.firebaseId));
      setProducts(prevProducts => prevProducts.filter(p => p.firebaseId !== productToDelete.firebaseId));
      toast({
        title: "პროდუქტი წაშლილია",
        description: `${productToDelete.name} წარმატებით წაიშალა.`,
      });
    } catch (err) {
      console.error("Error deleting product:", err);
      toast({
        title: "წაშლის შეცდომა",
        description: "პროდუქტის წაშლისას მოხდა შეცდომა.",
        variant: "destructive",
      });
    } finally {
      setIsAlertOpen(false);
      setProductToDelete(null);
      setIsLoading(false); 
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">პროდუქტების მართვა</h1>
          <p className="text-muted-foreground">დაათვალიერეთ, დაამატეთ და მართეთ თქვენი პროდუქტები.</p>
        </div>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/admin/products/add">
            <PlusCircle className="mr-2 h-5 w-5" /> ახალი პროდუქტის დამატება
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>პროდუქტების სია</CardTitle>
          <CardDescription>
            ყველა პროდუქტი თქვენს კატალოგში.
          </CardDescription>
          <div className="pt-4 flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="პროდუქტების ძიება..." 
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
          {isLoading && !isAlertOpen && ( 
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">პროდუქტები იტვირთება...</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="flex flex-col items-center justify-center py-10 text-destructive">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p className="text-lg font-semibold">შეცდომა!</p>
                <p>{error}</p>
             </div>
          )}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2" />
              <p>პროდუქტები ვერ მოიძებნა.</p>
              <p className="text-sm">დაამატეთ პირველი პროდუქტი "ახალი პროდუქტის დამატება" ღილაკით.</p>
            </div>
          )}
          {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2" />
                <p>თქვენი ძიების შესაბამისი პროდუქტი ვერ მოიძებნა.</p>
            </div>
          )}

          {!isLoading && !error && filteredProducts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">სურათი</TableHead>
                  <TableHead>დასახელება</TableHead>
                  <TableHead>კატეგორია</TableHead>
                  <TableHead>სტატუსი/მარაგი</TableHead>
                  <TableHead className="hidden md:table-cell">ფასი (L)</TableHead>
                  <TableHead className="hidden md:table-cell">ფასდაკლება (%)</TableHead>
                  <TableHead>
                    <span className="sr-only">მოქმედებები</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const statusInfo = getProductStockStatus(product);
                  return (
                    <TableRow key={product.firebaseId}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={(product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : `https://placehold.co/64x64.png?text=${product.name[0]}`}
                          width="64"
                          data-ai-hint={product.dataAiHint || "product image"}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={statusInfo.variant}
                            className={statusInfo.className}
                        >
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">L{product.price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">{product.discountPercentage || 0}%</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">მენიუს გახსნა</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>მოქმედებები</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                               <Link href={`/admin/products/edit/${product.firebaseId}`} className="flex items-center w-full">
                                 <Edit className="mr-2 h-4 w-4" /> რედაქტირება
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteConfirmation(product)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                              <Trash2 className="mr-2 h-4 w-4" /> წაშლა
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              პროდუქტის "{productToDelete?.name}" წაშლა გსურთ? ამ მოქმედების გაუქმება შეუძლებელია.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              {isLoading && productToDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
