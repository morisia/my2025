
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, ShoppingBasket, Users, Package as PackageIconLucide, Loader2, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts"; 
import { ResponsiveContainer } from "recharts"; 
import { collection, getDocs, query, Timestamp, where, orderBy as firestoreOrderBy, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminPanelOrder, OrderProductItem, ClothingItem } from '@/lib/types';

// Placeholder data for visitor - replace if real data becomes available
const visitorData = [
  { date: '01/07', visitors: 120 },
  { date: '02/07', visitors: 200 },
  { date: '03/07', visitors: 150 },
  { date: '04/07', visitors: 280 },
  { date: '05/07', visitors: 190 },
  { date: '06/07', visitors: 310 },
  { date: '07/07', visitors: 250 },
];

const PIE_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];


export default function AdminAnalyticsPage() {
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenueChangePercentage, setRevenueChangePercentage] = useState<string>("+0% გასული თვიდან");

  const [newOrdersCount, setNewOrdersCount] = useState<number | null>(null);
  const [isLoadingNewOrders, setIsLoadingNewOrders] = useState(true);
  const [newOrdersError, setNewOrdersError] = useState<string | null>(null);
  const [newOrdersChangePercentage, setNewOrdersChangePercentage] = useState<string>("+0% გასული თვიდან");

  const [salesOverviewData, setSalesOverviewData] = useState<Array<{ month: string; sales: number; revenue: number }>>([]);
  const [isLoadingSalesOverview, setIsLoadingSalesOverview] = useState(true);
  const [salesOverviewError, setSalesOverviewError] = useState<string | null>(null);

  const [productCategoriesData, setProductCategoriesData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoadingProductCategories, setIsLoadingProductCategories] = useState(true);
  const [productCategoriesError, setProductCategoriesError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRevenue(true);
      setRevenueError(null);
      setIsLoadingNewOrders(true);
      setNewOrdersError(null);
      setIsLoadingSalesOverview(true);
      setSalesOverviewError(null);
      setIsLoadingProductCategories(true);
      setProductCategoriesError(null);

      try {
        const ordersCollectionRef = collection(db, 'orders');
        const ordersQuery = query(ordersCollectionRef, firestoreOrderBy('createdAt', 'asc'));
        
        const productsCollectionRef = collection(db, 'products');
        const productsQuery = query(productsCollectionRef);

        const [ordersSnapshot, productsSnapshot] = await Promise.all([
          getDocs(ordersQuery),
          getDocs(productsQuery)
        ]);
        
        // Process Orders for Revenue, New Orders, Sales Overview
        let currentTotalRevenue = 0;
        let pendingOrdersCount = 0;
        const now = new Date();
        const georgianMonthsAbbr = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
        const salesByMonth: { [key: string]: { sales: number; revenue: number } } = {};
        const monthOrder: string[] = []; 

        for (let i = 5; i >= 0; i--) { 
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yearMonthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            salesByMonth[yearMonthKey] = { sales: 0, revenue: 0 };
            monthOrder.push(yearMonthKey);
        }
        
        const firstMonthDateInPeriod = new Date(parseInt(monthOrder[0].split('-')[0]), parseInt(monthOrder[0].split('-')[1]) - 1, 1);
        firstMonthDateInPeriod.setHours(0,0,0,0);

        ordersSnapshot.forEach((doc) => {
          const orderData = doc.data() as AdminPanelOrder;
          currentTotalRevenue += orderData.totalAmount;
          if (orderData.status === 'Pending') {
            pendingOrdersCount++;
          }

          if (orderData.createdAt instanceof Timestamp) {
            const orderDate = orderData.createdAt.toDate();
            if (orderDate >= firstMonthDateInPeriod) { 
                const yearMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                if (salesByMonth[yearMonthKey]) {
                    salesByMonth[yearMonthKey].sales += 1; 
                    salesByMonth[yearMonthKey].revenue += orderData.totalAmount;
                }
            }
          }
        });
        
        setTotalRevenue(currentTotalRevenue);
        setNewOrdersCount(pendingOrdersCount);

        if (currentTotalRevenue === 0) {
            setRevenueChangePercentage("შემოსავალი არ არის");
        } else {
            setRevenueChangePercentage(currentTotalRevenue > 1000 ? "+15.5% (სატესტო)" : "+5.2% (სატესტო)");
        }
        
        if (pendingOrdersCount === 0) {
            setNewOrdersChangePercentage("ახალი შეკვეთები არ არის");
        } else {
            setNewOrdersChangePercentage(pendingOrdersCount > 10 ? "+10.0% (სატესტო)" : "+3.0% (სატესტო)");
        }

        const formattedSalesData = monthOrder.map(key => {
            const dateParts = key.split('-');
            const monthIndex = parseInt(dateParts[1]) -1;
            return {
                month: georgianMonthsAbbr[monthIndex],
                sales: salesByMonth[key]?.sales || 0,
                revenue: salesByMonth[key]?.revenue || 0,
            };
        });
        setSalesOverviewData(formattedSalesData);

        // Process Products and Orders for Category Popularity
        const productIdToCategoryMap: { [productId: string]: string } = {};
        productsSnapshot.forEach(doc => {
          const product = doc.data() as ClothingItem;
          if (product.category) {
            productIdToCategoryMap[doc.id] = product.category;
          }
        });

        const categoryCounts: { [category: string]: number } = {};
        ordersSnapshot.forEach(orderDoc => {
          const order = orderDoc.data() as AdminPanelOrder;
          order.products.forEach(item => {
            const category = productIdToCategoryMap[item.productId];
            if (category) {
              categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
            } else {
               // Handle cases where product might be deleted or category not found
               categoryCounts['უცნობი კატეგორია'] = (categoryCounts['უცნობი კატეგორია'] || 0) + item.quantity;
            }
          });
        });
        
        const formattedProductCategories = Object.entries(categoryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by value descending

        setProductCategoriesData(formattedProductCategories);

      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setRevenueError("შემოსავლის ჩატვირთვისას მოხდა შეცდომა.");
        setNewOrdersError("ახალი შეკვეთების ჩატვირთვისას მოხდა შეცდომა.");
        setSalesOverviewError("გაყიდვების მიმოხილვის ჩატვირთვისას მოხდა შეცდომა.");
        setProductCategoriesError("კატეგორიების პოპულარობის ჩატვირთვისას მოხდა შეცდომა.");
        
        setTotalRevenue(0); 
        setNewOrdersCount(0);
        setSalesOverviewData(monthOrder.map(key => {
            const dateParts = key.split('-');
            const monthIndex = parseInt(dateParts[1]) -1;
            return { month: georgianMonthsAbbr[monthIndex], sales: 0, revenue: 0 };
        }));
        setProductCategoriesData([]);
      } finally {
        setIsLoadingRevenue(false);
        setIsLoadingNewOrders(false);
        setIsLoadingSalesOverview(false);
        setIsLoadingProductCategories(false);
      }
    };

    fetchData();
  }, []);


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">საიტის ანალიტიკა</h1>
        <p className="text-muted-foreground">მიმოიხილეთ თქვენი მაღაზიის ძირითადი მაჩვენებლები.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სრული შემოსავალი</CardTitle>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">იტვირთება...</span>
              </div>
            ) : revenueError ? (
              <div className="text-sm text-destructive flex items-center">
                 <AlertTriangle className="h-4 w-4 mr-1" /> {revenueError.substring(0, 25)}...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">L{totalRevenue !== null ? totalRevenue.toFixed(2) : '0.00'}</div>
                <p className="text-xs text-muted-foreground">{revenueChangePercentage}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ახალი შეკვეთები</CardTitle>
            <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingNewOrders ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">იტვირთება...</span>
              </div>
            ) : newOrdersError ? (
               <div className="text-sm text-destructive flex items-center">
                 <AlertTriangle className="h-4 w-4 mr-1" /> {newOrdersError.substring(0, 25)}...
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{newOrdersCount !== null ? newOrdersCount : '0'}</div>
                <p className="text-xs text-muted-foreground">{newOrdersChangePercentage}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ვიზიტორები</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,580</div>
            <p className="text-xs text-muted-foreground">+5.2% გუშინდელთან შედარებით</p>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">კონვერსიის რეიტი</CardTitle>
            <PackageIconLucide className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.45%</div>
            <p className="text-xs text-muted-foreground">+0.2% გასული კვირიდან</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>გაყიდვების მიმოხილვა (ბოლო 6 თვე)</CardTitle>
            <CardDescription>შემოსავალი (L) და გაყიდული ერთეულები.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSalesOverview ? (
                <div className="flex justify-center items-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : salesOverviewError ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-destructive">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p>{salesOverviewError}</p>
                </div>
              ) : (
                <ChartContainer config={{
                    sales: { label: 'ერთეული', color: 'hsl(var(--chart-1))' },
                    revenue: { label: 'შემოსავალი (L)', color: 'hsl(var(--chart-2))' },
                  }} className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPrimitive.BarChart data={salesOverviewData}>
                      <RechartsPrimitive.CartesianGrid vertical={false} />
                      <RechartsPrimitive.XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <RechartsPrimitive.YAxis tickLine={false} axisLine={false} />
                      <RechartsPrimitive.Tooltip
                        content={<ChartTooltipContent indicator="dot" />}
                        formatter={(value, name) => name === 'revenue' ? `L${Number(value).toFixed(2)}` : value}
                      />
                      <RechartsPrimitive.Legend />
                      <RechartsPrimitive.Bar dataKey="sales" fill="var(--color-sales)" radius={4} name="გაყ. ერთეული"/>
                      <RechartsPrimitive.Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} name="შემოსავალი" unit="L" />
                    </RechartsPrimitive.BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>ვიზიტორთა ნაკადი (ბოლო 7 დღე)</CardTitle>
            <CardDescription>საიტზე შემოსული უნიკალური ვიზიტორები.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
                visitors: { label: 'ვიზიტორები', color: 'hsl(var(--chart-1))' },
              }} className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPrimitive.LineChart data={visitorData}>
                  <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                  <RechartsPrimitive.XAxis dataKey="date" />
                  <RechartsPrimitive.YAxis />
                  <RechartsPrimitive.Tooltip content={<ChartTooltipContent indicator="line" />} />
                  <RechartsPrimitive.Legend />
                  <RechartsPrimitive.Line type="monotone" dataKey="visitors" stroke="var(--color-visitors)" strokeWidth={2} dot={{ r: 4 }} name="ვიზიტორები" />
                </RechartsPrimitive.LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>პროდუქტების კატეგორიების პოპულარობა</CardTitle>
          <CardDescription>გაყიდული პროდუქტების განაწილება კატეგორიების მიხედვით.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            {isLoadingProductCategories ? (
              <div className="flex justify-center items-center h-[300px] w-full max-w-md">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : productCategoriesError ? (
              <div className="flex flex-col items-center justify-center h-[300px] w-full max-w-md text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>{productCategoriesError}</p>
              </div>
            ) : productCategoriesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] w-full max-w-md text-muted-foreground">
                    <PackageIconLucide className="h-8 w-8 mb-2" />
                    <p>კატეგორიების მიხედვით გაყიდვების მონაცემები არ არის.</p>
                </div>
            ) : (
                <ChartContainer config={{
                    items: { label: 'ერთეული' },
                    ...productCategoriesData.reduce((acc: any, cur: any, index: number) => {
                        acc[cur.name] = { label: cur.name, color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] }
                        return acc;
                    }, {})
                    }} className="h-[300px] w-full max-w-md"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPrimitive.PieChart>
                            <RechartsPrimitive.Tooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                            <RechartsPrimitive.Pie
                                data={productCategoriesData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="hsl(var(--chart-1))" 
                            >
                                {productCategoriesData.map((entry, index) => (
                                <RechartsPrimitive.Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                            </RechartsPrimitive.Pie>
                            <RechartsPrimitive.Legend />
                        </RechartsPrimitive.PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
