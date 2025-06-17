
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Info, Brush, SearchCode, CreditCard, Truck, Image as ImageIconLucide, UploadCloud, Loader2, Share2, ImagePlus, Palette, PanelBottom, Link as LinkIcon, Trash2, PlusCircle, Clock, Landmark, Building, Phone, Mail as MailIcon, MapPin, AlertTriangle, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { uploadLogo, type UploadLogoInput } from '@/ai/flows/upload-logo-flow';
import { uploadBanner, type UploadBannerInput } from '@/ai/flows/upload-banner-flow';
import { uploadCraftsmanshipImage, type UploadCraftsmanshipImageInput } from '@/ai/flows/upload-craftsmanship-image-flow';
import { uploadHomePageAdImage, type UploadAdImageInput as UploadHomePageAdImageInput } from '@/ai/flows/upload-homepage-ad-image-flow';
import { uploadCatalogPageAdImage, type UploadAdImageInput as UploadCatalogPageAdImageInput } from '@/ai/flows/upload-catalogpage-ad-image-flow';
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { SiteSettings, FooterLinkConfig } from '@/lib/types';


const getFileDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); 
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingCraftsmanshipImage, setIsUploadingCraftsmanshipImage] = useState(false);
  const [isUploadingHomePageAd, setIsUploadingHomePageAd] = useState(false);
  const [isUploadingCatalogPageAd, setIsUploadingCatalogPageAd] = useState(false);

  const defaultSettings: SiteSettings = {
    siteName: "თბილისი სთაილს",
    contactEmail: "info@tiflisistyles.com",
    maintenanceMode: false,
    seoTitle: "თბილისი სთაილს - ქართული ტრადიციული ტანსაცმელი",
    seoMetaDescription: "აღმოაჩინეთ ავთენტური ქართული ტრადიციული ტანსაცმელი თბილისი სთაილსში. დაათვალიერეთ ჩვენი ჩოხების, ქართული კაბების და სხვა კოლექცია.",
    seoKeywords: "ქართული ტანსაცმელი, ჩოხა, ქართული კაბა, ტრადიციული, ფაფახი",
    backgroundHsl: "60 56% 91%",
    primaryHsl: "46 25% 63%",
    accentHsl: "25 70% 30%",
    logoUrl: "",
    ogTitle: "თბილისი სთაილს | ტრადიციული ქართული სამოსი",
    ogDescription: "აღმოაჩინეთ ქართული ტრადიციების სილამაზე ჩვენი ტანსაცმლის კოლექციით.",
    ogImageUrl: "https://placehold.co/1200x630.png?text=Tbilisi+Styles+OG",
    twitterCardType: "summary_large_image",
    twitterSite: "@TbilisiStyles",
    twitterCreator: "@TbilisiStyles",
    paypalEnabled: false,
    paypalClientId: "",
    stripeEnabled: false,
    stripePublicKey: "",
    tbcPayEnabled: false,
    tbcPayApiClientId: "",
    tbcPayApiSecret: "",
    cashOnDeliveryEnabled: true, 
    enableFlatRateShipping: false,
    defaultShippingCost: 10,
    freeShippingThreshold: 150,
    bannerImageUrl: "https://placehold.co/1200x400.png?text=Banner+Image",
    bannerHeading: "კეთილი იყოს თქვენი მობრძანება!",
    bannerSubtext: "აღმოაჩინეთ ჩვენი უახლესი კოლექცია და ისარგებლეთ სპეციალური ფასდაკლებით.",
    bannerCtaText: "კატალოგის ნახვა",
    bannerCtaLink: "/catalog",
    craftsmanshipTitle: "ჩვენი ხელოსნობა",
    craftsmanshipParagraph1: "თბილისი სთაილს-ში, ჩვენ ვართ ერთგულნი საქართველოს მდიდარი კულტურული მემკვიდრეობის შენარჩუნების ჩვენი საგულდაგულოდ დამზადებული ტრადიციული სამოსის მეშვეობით. თითოეული ნივთი ჰყვება ისტორიას, რომელიც ნაქსოვია ისტორიითა და ხელოვნებით.",
    craftsmanshipParagraph2: "ჩვენ ვიყენებთ მაღალი ხარისხის მასალებს და ვთანამშრომლობთ გამოცდილ ხელოსნებთან, რათა მოგაწოდოთ ავთენტური სამოსი, რომელიც აერთიანებს ტრადიციას თანამედროვე სტილთან.",
    craftsmanshipImageUrl: "https://placehold.co/600x400.png",
    craftsmanshipImageAiHint: "artisan craft",
    craftsmanshipLinkText: "შეიტყვეთ მეტი ჩვენ შესახებ",
    craftsmanshipLinkUrl: "/about",
    footerAppName: "თბილისი სთაილს",
    footerDescription: "აღმოაჩინეთ ტრადიციული ქართული სამოსის ელეგანტურობა. ხელნაკეთი ვნებითა და მემკვიდრეობით.",
    footerQuickLinks: [
      { id: '1', label: 'ჩვენ შესახებ', href: '/about' },
      { id: '2', label: 'მიწოდება და დაბრუნება', href: '/shipping' },
    ],
    footerColumn2Title: "სწრაფი ბმულები",
    footerColumn3Title: "დაგვიკავშირდით",
    footerSubscribeText: "გამოიწერეთ ჩვენი სიახლეები განახლებებისა და სპეციალური შეთავაზებებისთვის.",
    footerCopyrightText: "ყველა უფლება დაცულია.",
    footerMadeInText: "შექმნილია ❤️-ით თბილისში.",
    contactPageAddress: "რუსთაველის გამზ. 123, თბილისი, საქართველო",
    contactPagePhone: "+995 32 212 3456",
    contactPageDisplayEmail: "info@tiflisistyles.com",
    contactPageWorkingHours: "ორშაბათი - პარასკევი: 9:00 - 18:00 (GET)\nშაბათი: 10:00 - 16:00 (GET)\nკვირა: დაკეტილია",
    contactPageBankAccount: "",
    enableHomePageAd: false,
    homePageAdImageUrl: "https://placehold.co/1000x120.png?text=Homepage+Ad",
    homePageAdLinkUrl: "#",
    homePageAdAltText: "Homepage Advertisement",
    enableCatalogPageAd: false,
    catalogPageAdImageUrl: "https://placehold.co/1200x150.png?text=Catalog+Ad",
    catalogPageAdLinkUrl: "#",
    catalogPageAdAltText: "Catalog Page Advertisement",
  };

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [craftsmanshipImageFile, setCraftsmanshipImageFile] = useState<File | null>(null);
  const [craftsmanshipImagePreviewUrl, setCraftsmanshipImagePreviewUrl] = useState<string | null>(null);
  const [homePageAdFile, setHomePageAdFile] = useState<File | null>(null);
  const [homePageAdPreviewUrl, setHomePageAdPreviewUrl] = useState<string | null>(null);
  const [catalogPageAdFile, setCatalogPageAdFile] = useState<File | null>(null);
  const [catalogPageAdPreviewUrl, setCatalogPageAdPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsDataLoading(true);
      try {
        const settingsDocRef = doc(db, "siteConfiguration", "main");
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const fetchedData = docSnap.data() as Partial<SiteSettings>;
          const quickLinks = fetchedData.footerQuickLinks && Array.isArray(fetchedData.footerQuickLinks)
                               ? fetchedData.footerQuickLinks
                               : defaultSettings.footerQuickLinks;
          const cashOnDelivery = fetchedData.cashOnDeliveryEnabled === undefined 
                                ? defaultSettings.cashOnDeliveryEnabled 
                                : fetchedData.cashOnDeliveryEnabled;

          setSettings(prev => ({ 
            ...prev, 
            ...fetchedData, 
            footerQuickLinks: quickLinks, 
            cashOnDeliveryEnabled: cashOnDelivery,
            enableHomePageAd: fetchedData.enableHomePageAd === undefined ? defaultSettings.enableHomePageAd : fetchedData.enableHomePageAd,
            homePageAdImageUrl: fetchedData.homePageAdImageUrl || defaultSettings.homePageAdImageUrl,
            homePageAdLinkUrl: fetchedData.homePageAdLinkUrl || defaultSettings.homePageAdLinkUrl,
            homePageAdAltText: fetchedData.homePageAdAltText || defaultSettings.homePageAdAltText,
            enableCatalogPageAd: fetchedData.enableCatalogPageAd === undefined ? defaultSettings.enableCatalogPageAd : fetchedData.enableCatalogPageAd,
            catalogPageAdImageUrl: fetchedData.catalogPageAdImageUrl || defaultSettings.catalogPageAdImageUrl,
            catalogPageAdLinkUrl: fetchedData.catalogPageAdLinkUrl || defaultSettings.catalogPageAdLinkUrl,
            catalogPageAdAltText: fetchedData.catalogPageAdAltText || defaultSettings.catalogPageAdAltText,
          }));
        } else {
          // await setDoc(settingsDocRef, defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching site settings:", error);
        toast({
          title: "პარამეტრების ჩატვირთვის შეცდომა",
          description: "არსებული პარამეტრების ჩატვირთვა ვერ მოხერხდა.",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);


  useEffect(() => {
    if (logoFile) { const objectUrl = URL.createObjectURL(logoFile); setLogoPreviewUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); } 
    else { setLogoPreviewUrl(null); }
  }, [logoFile]);
  useEffect(() => {
    if (bannerFile) { const objectUrl = URL.createObjectURL(bannerFile); setBannerPreviewUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); } 
    else { setBannerPreviewUrl(null); }
  }, [bannerFile]);
  useEffect(() => {
    if (craftsmanshipImageFile) { const objectUrl = URL.createObjectURL(craftsmanshipImageFile); setCraftsmanshipImagePreviewUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); }
    else { setCraftsmanshipImagePreviewUrl(null); }
  }, [craftsmanshipImageFile]);
  useEffect(() => {
    if (homePageAdFile) { const objectUrl = URL.createObjectURL(homePageAdFile); setHomePageAdPreviewUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); }
    else { setHomePageAdPreviewUrl(null); }
  }, [homePageAdFile]);
  useEffect(() => {
    if (catalogPageAdFile) { const objectUrl = URL.createObjectURL(catalogPageAdFile); setCatalogPageAdPreviewUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); }
    else { setCatalogPageAdPreviewUrl(null); }
  }, [catalogPageAdFile]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumberInput = type === 'number';
    setSettings(prev => ({
        ...prev,
        [name]: isNumberInput ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSwitchChange = (checked: boolean, name: keyof SiteSettings) => {
    setSettings(prev => ({ ...prev, [name]: checked as SiteSettings[keyof SiteSettings & boolean] }));
  };

  const handleAddQuickLink = () => {
    setSettings(prev => ({
      ...prev,
      footerQuickLinks: [
        ...prev.footerQuickLinks,
        { id: Date.now().toString(), label: '', href: '' }
      ]
    }));
  };

  const handleQuickLinkChange = (id: string, field: 'label' | 'href', value: string) => {
    setSettings(prev => ({
      ...prev,
      footerQuickLinks: prev.footerQuickLinks.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const handleRemoveQuickLink = (id: string) => {
    setSettings(prev => ({
      ...prev,
      footerQuickLinks: prev.footerQuickLinks.filter(link => link.id !== id)
    }));
  };

  const handleImageUpload = async (
    file: File, 
    uploadFunction: (input: { fileDataUri: string }) => Promise<{ uploadedFileUrl: string }>,
    setUploadingState: React.Dispatch<React.SetStateAction<boolean>>,
    targetImageUrlField: keyof SiteSettings,
    setFileState: React.Dispatch<React.SetStateAction<File | null>>,
    toastTitle: string
    ) => {
    if (!file) return;
    setUploadingState(true);
    try {
      const fileDataUri = await getFileDataUri(file);
      const result = await uploadFunction({ fileDataUri });
      setSettings(prev => ({ ...prev, [targetImageUrlField]: result.uploadedFileUrl }));
      setFileState(null); 
      toast({ title: toastTitle, description: "სურათი წარმატებით აიტვირთა და URL განახლდა." });
    } catch (error) {
      console.error(`${toastTitle} error:`, error);
      toast({
        title: `${toastTitle} შეცდომა`,
        description: error instanceof Error ? error.message : "დაფიქსირდა უცნობი შეცდომა.",
        variant: "destructive",
      });
    } finally {
      setUploadingState(false);
    }
  };


  const handleSaveChanges = async () => {
    setIsLoading(true);
    // Image uploads are now handled on file selection, so we just save settings
    try {
      const finalSettings = {
         ...settings,
         defaultShippingCost: Number(settings.defaultShippingCost) || 0,
         freeShippingThreshold: Number(settings.freeShippingThreshold) || 0,
      };
      const settingsDocRef = doc(db, "siteConfiguration", "main");
      await setDoc(settingsDocRef, finalSettings, { merge: true });
      toast({
        title: "პარამეტრები შენახულია!",
        description: "თქვენი ცვლილებები წარმატებით შეინახა მონაცემთა ბაზაში.",
      });
    } catch (error) {
       console.error("Error saving settings to Firestore:", error);
        toast({
          title: "შენახვის შეცდომა",
          description: "პარამეტრების მონაცემთა ბაზაში შენახვისას მოხდა შეცდომა.",
          variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLogoDisplayUrl = logoPreviewUrl || settings.logoUrl;
  const currentBannerDisplayUrl = bannerPreviewUrl || settings.bannerImageUrl;
  const currentCraftsmanshipImageDisplayUrl = craftsmanshipImagePreviewUrl || settings.craftsmanshipImageUrl;
  const currentHomePageAdDisplayUrl = homePageAdPreviewUrl || settings.homePageAdImageUrl;
  const currentCatalogPageAdDisplayUrl = catalogPageAdPreviewUrl || settings.catalogPageAdImageUrl;


  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">პარამეტრები იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Settings className="mr-3 h-8 w-8" /> საიტის პარამეტრები
        </h1>
        <p className="text-muted-foreground">მართეთ თქვენი ვებსაიტის ძირითადი კონფიგურაციები.</p>
      </header>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/> ზოგადი პარამეტრები</CardTitle>
                <CardDescription>საიტის ძირითადი ინფორმაცია და კონტაქტები.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="siteName">საიტის დასახელება</Label>
                  <Input id="siteName" name="siteName" value={settings.siteName} onChange={handleInputChange} placeholder="თქვენი საიტის სახელი" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactEmail">საკონტაქტო ელ. ფოსტა (საიტის ადმინისტრაციისთვის)</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleInputChange} placeholder="info@example.com" />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'maintenanceMode')}
                  />
                  <Label htmlFor="maintenanceMode" className="cursor-pointer">ტექნიკური მომსახურების რეჟიმი</Label>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center"><Brush className="mr-2 h-5 w-5 text-primary"/> ვიზუალური პარამეტრები</CardTitle>
                <CardDescription>
                  შეცვალეთ საიტის ძირითადი ფერები. ატვირთეთ ახალი ლოგო.
                </CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="backgroundHsl">ფონის ფერი (HSL)</Label>
                      <Input id="backgroundHsl" name="backgroundHsl" value={settings.backgroundHsl} onChange={handleInputChange} placeholder="მაგ: 60 56% 91%" />
                      <p className="text-sm text-muted-foreground"> შეიყვანეთ HSL მნიშვნელობა, მაგალითად: "60 56% 91%" </p>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="primaryHsl">ძირითადი ფერი (HSL)</Label>
                      <Input id="primaryHsl" name="primaryHsl" value={settings.primaryHsl} onChange={handleInputChange} placeholder="მაგ: 46 25% 63%" />
                      <p className="text-sm text-muted-foreground"> შეიყვანეთ HSL მნიშვნელობა, მაგალითად: "46 25% 63%" </p>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="accentHsl">აქცენტის ფერი (HSL)</Label>
                      <Input id="accentHsl" name="accentHsl" value={settings.accentHsl} onChange={handleInputChange} placeholder="მაგ: 25 70% 30%" />
                      <p className="text-sm text-muted-foreground"> შეიყვანეთ HSL მნიშვნელობა, მაგალითად: "25 70% 30%" </p>
                  </div>
                  <Separator className="my-6" />
                  <div className="space-y-2">
                      <Label htmlFor="logoUrl">ლოგოს URL (განახლდება ატვირთვისას)</Label>
                      <Input id="logoUrl" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="logoFile">ატვირთეთ ახალი ლოგო (PNG, JPG, GIF, SVG)</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                          <UploadCloud className="h-8 w-8 text-muted-foreground shrink-0" />
                          <Input
                              id="logoFile"
                              type="file"
                              accept="image/png, image/jpeg, image/gif, image/svg+xml"
                              onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, uploadLogo, setIsUploadingLogo, 'logoUrl', setLogoFile, 'ლოგოს ატვირთვა');
                                  }
                              }}
                              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          {isUploadingLogo && <Loader2 className="h-5 w-5 animate-spin" />}
                      </div>
                  </div>

                  {(currentLogoDisplayUrl) && (
                    <div className="mt-4 space-y-2">
                      <Label>ლოგოს გადახედვა:</Label>
                      <div className="p-2 border rounded-md inline-block bg-muted min-w-[100px] min-h-[40px] flex items-center justify-center">
                        {currentLogoDisplayUrl ? (
                          <Image
                            src={currentLogoDisplayUrl}
                            alt="ლოგოს გადახედვა"
                            width={100}
                            height={40}
                            className="object-contain max-h-[40px]"
                            key={currentLogoDisplayUrl}
                            unoptimized={currentLogoDisplayUrl.endsWith('.gif')}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const parent = (e.target as HTMLImageElement).parentElement; if (parent && !parent.querySelector('.placeholder-icon')) { const placeholder = document.createElement('div'); placeholder.className = 'placeholder-icon flex items-center justify-center w-[100px] h-[40px]'; placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off h-6 w-6 text-muted-foreground"><path d="M21.12 5.52A3.002 3.002 0 0 0 19.01 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2h14.03c.97 0 1.82-.69 2.05-1.62"/><path d="m2 2 20 20"/><path d="M11.35 8.65A3 3 0 0 0 8.5 8a3 3 0 0 0 0 6c.92 0 1.76-.43 2.31-.11"/><path d="m15 13-1.65-1.65M19 15l-4.5-4.5M3 19l3.75-3.75"/></svg>'; parent.appendChild(placeholder); } }}
                          />
                        ) : ( <div className="flex items-center justify-center w-[100px] h-[40px]"><ImageIconLucide className="h-6 w-6 text-muted-foreground" /></div> )}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground pt-2">
                      სხვა ვიზუალური პარამეტრების მართვა, როგორიცაა შრიფტები ან განლაგების სტილები, მალე დაემატება.
                  </p>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center"><SearchCode className="mr-2 h-5 w-5 text-primary"/> SEO პარამეტრები</CardTitle>
                 <CardDescription>
                  აქ შეგიძლიათ შეცვალოთ ნაგულისხმევი SEO სათაური, მეტა აღწერილობა და საკვანძო სიტყვები.
                </CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="seoTitle">ნაგულისხმევი SEO სათაური</Label>
                  <Input id="seoTitle" name="seoTitle" value={settings.seoTitle} onChange={handleInputChange} placeholder="საიტის სათაური Google-სთვის" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="seoMetaDescription">ნაგულისხმევი SEO მეტა აღწერილობა</Label>
                  <Textarea
                    id="seoMetaDescription"
                    name="seoMetaDescription"
                    value={settings.seoMetaDescription}
                    onChange={handleInputChange}
                    placeholder="საიტის მოკლე აღწერა საძიებო სისტემებისთვის (რეკომენდირებულია ~160 სიმბოლო)."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="seoKeywords">ნაგულისხმევი SEO საკვანძო სიტყვები (მძიმით გამოყოფილი)</Label>
                  <Input
                    id="seoKeywords"
                    name="seoKeywords"
                    value={settings.seoKeywords}
                    onChange={handleInputChange}
                    placeholder="მაგ: ქართული ტანსაცმელი, ჩოხა, აქსესუარები"
                  />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-4" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <Share2 className="mr-2 h-5 w-5 text-primary"/> სოციალური მედიის ბარათები
                </CardTitle>
                <CardDescription>
                  განსაზღვრეთ, როგორ გამოჩნდება თქვენი საიტის ბმულები სოციალურ ქსელებში (Facebook, Twitter, LinkedIn და ა.შ.).
                </CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="ogTitle">OG სათაური (Open Graph Title)</Label>
                  <Input id="ogTitle" name="ogTitle" value={settings.ogTitle} onChange={handleInputChange} placeholder="სათაური Facebook-ზე, LinkedIn-ზე გაზიარებისთვის" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ogDescription">OG აღწერა (Open Graph Description)</Label>
                  <Textarea id="ogDescription" name="ogDescription" value={settings.ogDescription} onChange={handleInputChange} placeholder="მოკლე აღწერა სოციალური ქსელებისთვის (~2-4 წინადადება)" rows={3}/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ogImageUrl">OG სურათის URL (Open Graph Image URL)</Label>
                  <Input id="ogImageUrl" name="ogImageUrl" type="url" value={settings.ogImageUrl} onChange={handleInputChange} placeholder="https://example.com/og-image.png" />
                  <p className="text-sm text-muted-foreground">რეკომენდირებული ზომა: 1200x630 პიქსელი.</p>
                </div>
                <Separator className="my-6" />
                <h4 className="text-md font-semibold text-muted-foreground pt-2">Twitter ბარათის პარამეტრები</h4>
                <div className="space-y-1">
                  <Label htmlFor="twitterCardType">Twitter ბარათის ტიპი</Label>
                  <Input id="twitterCardType" name="twitterCardType" value={settings.twitterCardType} onChange={handleInputChange} placeholder="summary_large_image" />
                  <p className="text-sm text-muted-foreground">მაგ: summary, summary_large_image, player, app.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="twitterSite">Twitter საიტის @სახელი</Label>
                  <Input id="twitterSite" name="twitterSite" value={settings.twitterSite} onChange={handleInputChange} placeholder="@YourSiteHandle" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="twitterCreator">Twitter ავტორის @სახელი (არასავალდებულო)</Label>
                  <Input id="twitterCreator" name="twitterCreator" value={settings.twitterCreator} onChange={handleInputChange} placeholder="@YourCreatorHandle" />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/> გადახდის სისტემები</CardTitle>
                <CardDescription>გადახდის მეთოდების ზოგადი პარამეტრების მართვა.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-6">
                  <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                          <Switch
                          id="cashOnDeliveryEnabled"
                          checked={settings.cashOnDeliveryEnabled}
                          onCheckedChange={(checked) => handleSwitchChange(checked, 'cashOnDeliveryEnabled')}
                          />
                          <Label htmlFor="cashOnDeliveryEnabled" className="cursor-pointer">გადახდა კურიერთან (Cash on Delivery) ჩართვა</Label>
                      </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                          <Switch
                          id="paypalEnabled"
                          checked={settings.paypalEnabled}
                          onCheckedChange={(checked) => handleSwitchChange(checked, 'paypalEnabled')}
                          />
                          <Label htmlFor="paypalEnabled" className="cursor-pointer">PayPal-ის ჩართვა</Label>
                      </div>
                      {settings.paypalEnabled && (
                          <div className="space-y-1 pl-8">
                              <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                              <Input id="paypalClientId" name="paypalClientId" value={settings.paypalClientId} onChange={handleInputChange} placeholder="თქვენი PayPal Client ID" />
                          </div>
                      )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                          <Switch
                          id="stripeEnabled"
                          checked={settings.stripeEnabled}
                          onCheckedChange={(checked) => handleSwitchChange(checked, 'stripeEnabled')}
                          />
                          <Label htmlFor="stripeEnabled" className="cursor-pointer">Stripe-ის ჩართვა</Label>
                      </div>
                      {settings.stripeEnabled && (
                          <div className="space-y-1 pl-8">
                              <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                              <Input id="stripePublicKey" name="stripePublicKey" value={settings.stripePublicKey} onChange={handleInputChange} placeholder="pk_live_xxxxxxxxxxxx" />
                          </div>
                      )}
                  </div>
                  <Separator />
                   <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                          <Switch
                          id="tbcPayEnabled"
                          checked={settings.tbcPayEnabled}
                          onCheckedChange={(checked) => handleSwitchChange(checked, 'tbcPayEnabled')}
                          />
                          <Label htmlFor="tbcPayEnabled" className="cursor-pointer">TBC Pay-ს ჩართვა</Label>
                      </div>
                      {settings.tbcPayEnabled && (
                          <div className="space-y-3 pl-8">
                            <div className="space-y-1">
                                <Label htmlFor="tbcPayApiClientId">TBC Pay API Client ID</Label>
                                <Input id="tbcPayApiClientId" name="tbcPayApiClientId" value={settings.tbcPayApiClientId} onChange={handleInputChange} placeholder="TBC Pay Client ID" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="tbcPayApiSecret">TBC Pay API Secret</Label>
                                <Input id="tbcPayApiSecret" type="password" name="tbcPayApiSecret" value={settings.tbcPayApiSecret} onChange={handleInputChange} placeholder="TBC Pay API Secret" />
                                <p className="text-xs text-destructive flex items-center mt-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  <strong>მნიშვნელოვანია:</strong> ეს საიდუმლო ინახება პირდაპირ. რეკომენდებულია მისი დაშიფვრა სერვერზე შენახვამდე ან Google Secret Manager-ის გამოყენება.
                                </p>
                            </div>
                          </div>
                      )}
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                      ადგილობრივი ბანკების და სხვა გადახდის სისტემების ინტეგრაციის პარამეტრები
                  </p>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-6" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center"><Truck className="mr-2 h-5 w-5 text-primary"/> მიწოდების პარამეტრები</CardTitle>
                <CardDescription>მართეთ მიწოდების საბაზისო მეთოდები და ტარიფები.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableFlatRateShipping"
                    checked={settings.enableFlatRateShipping}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'enableFlatRateShipping')}
                  />
                  <Label htmlFor="enableFlatRateShipping" className="cursor-pointer">ფიქსირებული მიწოდების ტარიფის ჩართვა</Label>
                </div>

                {settings.enableFlatRateShipping && (
                  <div className="space-y-1 pl-8">
                    <Label htmlFor="defaultShippingCost">ნაგულისხმევი მიწოდების ღირებულება (L)</Label>
                    <Input
                      id="defaultShippingCost"
                      name="defaultShippingCost"
                      type="number"
                      value={settings.defaultShippingCost}
                      onChange={handleInputChange}
                      placeholder="მაგ: 10"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="freeShippingThreshold">უფასო მიწოდების ზღვარი (L)</Label>
                  <Input
                    id="freeShippingThreshold"
                    name="freeShippingThreshold"
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={handleInputChange}
                    placeholder="მაგ: 150 (0 - გამორთულია)"
                  />
                  <p className="text-xs text-muted-foreground">შეიყვანეთ თანხა, რომლის ზემოთაც მიწოდება უფასო იქნება. 0 ნიშნავს, რომ ეს ფუნქცია გამორთულია.</p>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  მიწოდების ზონები, კომპანიებთან ინტეგრაციის და სხვა დეტალური პარამეტრების მართვა
                </p>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-7" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <ImagePlus className="mr-2 h-5 w-5 text-primary"/> ბანერის პარამეტრები
                </CardTitle>
                <CardDescription>მართეთ თქვენი საიტის მთავარი ბანერის სურათი და ტექსტები.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="bannerImageUrl">ბანერის სურათის URL (განახლდება ატვირთვისას)</Label>
                  <Input id="bannerImageUrl" name="bannerImageUrl" value={settings.bannerImageUrl} onChange={handleInputChange} placeholder="https://example.com/banner.png" />
                </div>

                <div className="space-y-2">
                      <Label htmlFor="bannerFile">ატვირთეთ ახალი ბანერის სურათი (PNG, JPG, GIF)</Label>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                          <UploadCloud className="h-8 w-8 text-muted-foreground shrink-0" />
                          <Input
                              id="bannerFile"
                              type="file"
                              accept="image/png, image/jpeg, image/gif"
                               onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, uploadBanner, setIsUploadingBanner, 'bannerImageUrl', setBannerFile, 'ბანერის ატვირთვა');
                                  }
                              }}
                              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          {isUploadingBanner && <Loader2 className="h-5 w-5 animate-spin" />}
                      </div>
                  </div>
                  {(currentBannerDisplayUrl) && (
                    <div className="mt-4 space-y-2">
                      <Label>ბანერის გადახედვა:</Label>
                      <div className="p-2 border rounded-md bg-muted aspect-video max-w-md mx-auto flex items-center justify-center">
                        {currentBannerDisplayUrl ? (
                          <Image
                            src={currentBannerDisplayUrl}
                            alt="ბანერის გადახედვა"
                            width={600}
                            height={200}
                            className="object-contain max-h-[200px] w-auto"
                            key={currentBannerDisplayUrl}
                            unoptimized={currentBannerDisplayUrl.endsWith('.gif')}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const parent = (e.target as HTMLImageElement).parentElement; if (parent && !parent.querySelector('.placeholder-icon-banner')) { const placeholder = document.createElement('div'); placeholder.className = 'placeholder-icon-banner flex items-center justify-center w-full h-full'; placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off h-8 w-8 text-muted-foreground"><path d="M21.12 5.52A3.002 3.002 0 0 0 19.01 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2h14.03c.97 0 1.82-.69 2.05-1.62"/><path d="m2 2 20 20"/><path d="M11.35 8.65A3 3 0 0 0 8.5 8a3 3 0 0 0 0 6c.92 0 1.76-.43 2.31-.11"/><path d="m15 13-1.65-1.65M19 15l-4.5-4.5M3 19l3.75-3.75"/></svg>'; parent.appendChild(placeholder); } }}
                          />
                        ) : ( <div className="flex items-center justify-center w-full h-full"><ImageIconLucide className="h-8 w-8 text-muted-foreground" /></div> )}
                      </div>
                    </div>
                  )}

                <div className="space-y-1">
                  <Label htmlFor="bannerHeading">ბანერის სათაური</Label>
                  <Input id="bannerHeading" name="bannerHeading" value={settings.bannerHeading} onChange={handleInputChange} placeholder="ბანერის მთავარი ტექსტი" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bannerSubtext">ბანერის ქვეტექსტი/აღწერა</Label>
                  <Textarea id="bannerSubtext" name="bannerSubtext" value={settings.bannerSubtext} onChange={handleInputChange} placeholder="დამატებითი ინფორმაცია ბანერზე" rows={3}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="bannerCtaText">მოწოდების ღილაკის ტექსტი</Label>
                        <Input id="bannerCtaText" name="bannerCtaText" value={settings.bannerCtaText} onChange={handleInputChange} placeholder="მაგ: მეტის ნახვა" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="bannerCtaLink">მოწოდების ღილაკის ბმული</Label>
                        <Input id="bannerCtaLink" name="bannerCtaLink" value={settings.bannerCtaLink} onChange={handleInputChange} placeholder="/catalog" />
                    </div>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-8" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5 text-primary"/> ჩვენი ხელოსნობა სექციის მართვა
                </CardTitle>
                <CardDescription>მართეთ "ჩვენი ხელოსნობა" სექციის შიგთავსი მთავარ გვერდზე.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="craftsmanshipTitle">სექციის სათაური</Label>
                  <Input id="craftsmanshipTitle" name="craftsmanshipTitle" value={settings.craftsmanshipTitle} onChange={handleInputChange} placeholder="სექციის მთავარი სათაური" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="craftsmanshipParagraph1">პირველი აბზაცი</Label>
                  <Textarea id="craftsmanshipParagraph1" name="craftsmanshipParagraph1" value={settings.craftsmanshipParagraph1} onChange={handleInputChange} placeholder="პირველი აბზაცის ტექსტი" rows={3}/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="craftsmanshipParagraph2">მეორე აბზაცი</Label>
                  <Textarea id="craftsmanshipParagraph2" name="craftsmanshipParagraph2" value={settings.craftsmanshipParagraph2} onChange={handleInputChange} placeholder="მეორე აბზაცის ტექსტი" rows={3}/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="craftsmanshipImageUrl">სურათის URL (განახლდება ატვირთვისას)</Label>
                  <Input id="craftsmanshipImageUrl" name="craftsmanshipImageUrl" value={settings.craftsmanshipImageUrl} onChange={handleInputChange} placeholder="https://example.com/craft-image.png" />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="craftsmanshipImageAiHint">სურათის AI მინიშნება (data-ai-hint)</Label>
                  <Input id="craftsmanshipImageAiHint" name="craftsmanshipImageAiHint" value={settings.craftsmanshipImageAiHint} onChange={handleInputChange} placeholder="მაგ: artisan working" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="craftsmanshipImageFile">ატვირთეთ ახალი სურათი (PNG, JPG, GIF)</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                        <UploadCloud className="h-8 w-8 text-muted-foreground shrink-0" />
                        <Input
                            id="craftsmanshipImageFile"
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(file, uploadCraftsmanshipImage, setIsUploadingCraftsmanshipImage, 'craftsmanshipImageUrl', setCraftsmanshipImageFile, 'ხელოსნობის სურათის ატვირთვა');
                                }
                            }}
                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {isUploadingCraftsmanshipImage && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                </div>
                {(currentCraftsmanshipImageDisplayUrl) && (
                  <div className="mt-4 space-y-2">
                    <Label>სურათის გადახედვა:</Label>
                    <div className="p-2 border rounded-md bg-muted aspect-video max-w-md mx-auto flex items-center justify-center">
                      {currentCraftsmanshipImageDisplayUrl ? (
                        <Image
                          src={currentCraftsmanshipImageDisplayUrl}
                          alt="ხელოსნობის სურათის გადახედვა"
                          width={400}
                          height={225}
                          className="object-contain max-h-[225px] w-auto"
                          key={currentCraftsmanshipImageDisplayUrl}
                          unoptimized={currentCraftsmanshipImageDisplayUrl.endsWith('.gif')}
                           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const parent = (e.target as HTMLImageElement).parentElement; if (parent && !parent.querySelector('.placeholder-icon-craft')) { const placeholder = document.createElement('div'); placeholder.className = 'placeholder-icon-craft flex items-center justify-center w-full h-full'; placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off h-8 w-8 text-muted-foreground"><path d="M21.12 5.52A3.002 3.002 0 0 0 19.01 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2h14.03c.97 0 1.82-.69 2.05-1.62"/><path d="m2 2 20 20"/><path d="M11.35 8.65A3 3 0 0 0 8.5 8a3 3 0 0 0 0 6c.92 0 1.76-.43 2.31-.11"/><path d="m15 13-1.65-1.65M19 15l-4.5-4.5M3 19l3.75-3.75"/></svg>'; parent.appendChild(placeholder); } }}
                        />
                      ) : ( <div className="flex items-center justify-center w-full h-full"><ImageIconLucide className="h-8 w-8 text-muted-foreground" /></div> )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor="craftsmanshipLinkText">ბმულის ტექსტი</Label>
                      <Input id="craftsmanshipLinkText" name="craftsmanshipLinkText" value={settings.craftsmanshipLinkText} onChange={handleInputChange} placeholder="მაგ: მეტის ნახვა" />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="craftsmanshipLinkUrl">ბმულის URL</Label>
                      <Input id="craftsmanshipLinkUrl" name="craftsmanshipLinkUrl" value={settings.craftsmanshipLinkUrl} onChange={handleInputChange} placeholder="/about-us" />
                  </div>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="item-9" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <PanelBottom className="mr-2 h-5 w-5 text-primary"/> ფუთერის პარამეტრები
                </CardTitle>
                <CardDescription>მართეთ თქვენი საიტის ქვედა კოლონტიტულის შიგთავსი.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="footerAppName">ფუთერის აპლიკაციის სახელი</Label>
                  <Input id="footerAppName" name="footerAppName" value={settings.footerAppName} onChange={handleInputChange} placeholder="აპლიკაციის სახელი ფუთერში" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="footerDescription">ფუთერის აღწერა</Label>
                  <Textarea id="footerDescription" name="footerDescription" value={settings.footerDescription} onChange={handleInputChange} placeholder="მოკლე აღწერა ფუთერისთვის" rows={2}/>
                </div>

                <div className="space-y-3 pt-2">
                  <Label htmlFor="footerColumn2Title">სვეტი 2-ის სათაური (სწრაფი ბმულები)</Label>
                  <Input id="footerColumn2Title" name="footerColumn2Title" value={settings.footerColumn2Title} onChange={handleInputChange} placeholder="მაგ: სწრაფი ბმულები" />

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">სწრაფი ბმულები:</Label>
                    {settings.footerQuickLinks.map((link, index) => (
                      <div key={link.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          type="text"
                          placeholder="ბმულის დასახელება"
                          value={link.label}
                          onChange={(e) => handleQuickLinkChange(link.id, 'label', e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          type="text"
                          placeholder="URL (მაგ: /about)"
                          value={link.href}
                          onChange={(e) => handleQuickLinkChange(link.id, 'href', e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveQuickLink(link.id)}
                          aria-label="ბმულის წაშლა"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuickLink} className="mt-2">
                      <PlusCircle className="mr-2 h-4 w-4" /> სწრაფი ბმულის დამატება
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="footerColumn3Title">სვეტი 3-ის სათაური (კონტაქტი/სოც. ქსელები)</Label>
                  <Input id="footerColumn3Title" name="footerColumn3Title" value={settings.footerColumn3Title} onChange={handleInputChange} placeholder="მაგ: დაგვიკავშირდით" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="footerSubscribeText">გამოწერის ტექსტი (სვეტი 3)</Label>
                  <Textarea id="footerSubscribeText" name="footerSubscribeText" value={settings.footerSubscribeText} onChange={handleInputChange} placeholder="მაგ: გამოიწერეთ ჩვენი სიახლეები..." rows={2}/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="footerCopyrightText">საავტორო უფლებების ტექსტი</Label>
                  <Input id="footerCopyrightText" name="footerCopyrightText" value={settings.footerCopyrightText} onChange={handleInputChange} placeholder="მაგ: ყველა უფლება დაცულია." />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="footerMadeInText">"დამზადებულია" ტექსტი</Label>
                  <Input id="footerMadeInText" name="footerMadeInText" value={settings.footerMadeInText} onChange={handleInputChange} placeholder="მაგ: შექმნილია ❤️-ით თბილისში." />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

         <AccordionItem value="item-10" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <MailIcon className="mr-2 h-5 w-5 text-primary"/> კონტაქტების გვერდის პარამეტრები
                </CardTitle>
                <CardDescription>მართეთ ინფორმაცია, რომელიც გამოჩნდება "კონტაქტი"-ს გვერდზე.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="contactPageAddress" className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> მისამართი</Label>
                  <Input id="contactPageAddress" name="contactPageAddress" value={settings.contactPageAddress || ''} onChange={handleInputChange} placeholder="მაგ: რუსთაველის გამზ. 123, თბილისი" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPagePhone" className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /> ტელეფონი</Label>
                  <Input id="contactPagePhone" name="contactPagePhone" value={settings.contactPagePhone || ''} onChange={handleInputChange} placeholder="+995 32 212 3456" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPageDisplayEmail" className="flex items-center"><MailIcon className="mr-2 h-4 w-4 text-muted-foreground" /> ელ. ფოსტა (გამოსაჩენად)</Label>
                  <Input id="contactPageDisplayEmail" name="contactPageDisplayEmail" type="email" value={settings.contactPageDisplayEmail || ''} onChange={handleInputChange} placeholder="contact@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPageWorkingHours" className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> სამუშაო საათები</Label>
                  <Textarea id="contactPageWorkingHours" name="contactPageWorkingHours" value={settings.contactPageWorkingHours || ''} onChange={handleInputChange} placeholder="მაგ: ორშ-პარ: 9:00-18:00..." rows={3}/>
                   <p className="text-xs text-muted-foreground">შეგიძლიათ შეიყვანოთ რამდენიმე ხაზი.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPageBankAccount" className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-muted-foreground" /> საბანკო ანგარიშის ნომერი (არასავალდებულო)</Label>
                  <Input id="contactPageBankAccount" name="contactPageBankAccount" value={settings.contactPageBankAccount || ''} onChange={handleInputChange} placeholder="მაგ: GE00XX0000000000000000" />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <AccordionItem value="item-11" className="border-none">
          <Card className="shadow-sm">
            <AccordionTrigger className="w-full p-0 hover:no-underline [&_svg]:mx-6">
              <CardHeader className="flex-1 text-left">
                <CardTitle className="flex items-center">
                  <Megaphone className="mr-2 h-5 w-5 text-primary"/> სარეკლამო ბლოკების მართვა
                </CardTitle>
                <CardDescription>მართეთ სარეკლამო ბლოკები მთავარ და კატალოგის გვერდებზე.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="space-y-6">
                {/* Homepage Ad Settings */}
                <div className="space-y-4 p-4 border rounded-md">
                  <h4 className="text-lg font-medium text-foreground">მთავარი გვერდის რეკლამა</h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableHomePageAd"
                      checked={settings.enableHomePageAd || false}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'enableHomePageAd')}
                    />
                    <Label htmlFor="enableHomePageAd" className="cursor-pointer">მთავარი გვერდის რეკლამის ჩვენება</Label>
                  </div>
                  {settings.enableHomePageAd && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="homePageAdImageUrl">სურათის URL</Label>
                        <Input id="homePageAdImageUrl" name="homePageAdImageUrl" value={settings.homePageAdImageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/home-ad.png" />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="homePageAdFile">ატვირთეთ მთავარი გვერდის რეკლამის სურათი (PNG, JPG, GIF)</Label>
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                            <UploadCloud className="h-8 w-8 text-muted-foreground shrink-0" />
                            <Input
                                id="homePageAdFile"
                                type="file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file, uploadHomePageAdImage, setIsUploadingHomePageAd, 'homePageAdImageUrl', setHomePageAdFile, 'მთავარი გვერდის რეკლამის სურათის ატვირთვა');
                                    }
                                }}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            {isUploadingHomePageAd && <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                      </div>
                       {(currentHomePageAdDisplayUrl) && (
                        <div className="mt-2">
                            <Label className="text-xs text-muted-foreground">სურათის გადახედვა:</Label>
                            <Image src={currentHomePageAdDisplayUrl} alt={settings.homePageAdAltText || "Homepage Ad Preview"} width={300} height={60} className="rounded-md border object-cover mt-1" unoptimized={currentHomePageAdDisplayUrl.endsWith('.gif')} />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor="homePageAdLinkUrl">ბმულის URL</Label>
                        <Input id="homePageAdLinkUrl" name="homePageAdLinkUrl" value={settings.homePageAdLinkUrl || ''} onChange={handleInputChange} placeholder="https://example.com/product-page" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="homePageAdAltText">Alt ტექსტი სურათისთვის</Label>
                        <Input id="homePageAdAltText" name="homePageAdAltText" value={settings.homePageAdAltText || ''} onChange={handleInputChange} placeholder="სარეკლამო ბანერი" />
                      </div>
                    </>
                  )}
                </div>

                {/* Catalog Page Ad Settings */}
                <div className="space-y-4 p-4 border rounded-md">
                  <h4 className="text-lg font-medium text-foreground">კატალოგის გვერდის რეკლამა</h4>
                   <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCatalogPageAd"
                      checked={settings.enableCatalogPageAd || false}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'enableCatalogPageAd')}
                    />
                    <Label htmlFor="enableCatalogPageAd" className="cursor-pointer">კატალოგის გვერდის რეკლამის ჩვენება</Label>
                  </div>
                  {settings.enableCatalogPageAd && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="catalogPageAdImageUrl">სურათის URL</Label>
                        <Input id="catalogPageAdImageUrl" name="catalogPageAdImageUrl" value={settings.catalogPageAdImageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/catalog-ad.png" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catalogPageAdFile">ატვირთეთ კატალოგის გვერდის რეკლამის სურათი (PNG, JPG, GIF)</Label>
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                            <UploadCloud className="h-8 w-8 text-muted-foreground shrink-0" />
                            <Input
                                id="catalogPageAdFile"
                                type="file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file, uploadCatalogPageAdImage, setIsUploadingCatalogPageAd, 'catalogPageAdImageUrl', setCatalogPageAdFile, 'კატალოგის გვერდის რეკლამის სურათის ატვირთვა');
                                    }
                                }}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            {isUploadingCatalogPageAd && <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                      </div>
                       {(currentCatalogPageAdDisplayUrl) && (
                        <div className="mt-2">
                            <Label className="text-xs text-muted-foreground">სურათის გადახედვა:</Label>
                            <Image src={currentCatalogPageAdDisplayUrl} alt={settings.catalogPageAdAltText || "Catalog Ad Preview"} width={300} height={60} className="rounded-md border object-cover mt-1" unoptimized={currentCatalogPageAdDisplayUrl.endsWith('.gif')}/>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor="catalogPageAdLinkUrl">ბმულის URL</Label>
                        <Input id="catalogPageAdLinkUrl" name="catalogPageAdLinkUrl" value={settings.catalogPageAdLinkUrl || ''} onChange={handleInputChange} placeholder="https://example.com/category-page" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="catalogPageAdAltText">Alt ტექსტი სურათისთვის</Label>
                        <Input id="catalogPageAdAltText" name="catalogPageAdAltText" value={settings.catalogPageAdAltText || ''} onChange={handleInputChange} placeholder="სარეკლამო ბანერი კატალოგში" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

      </Accordion>


      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={handleSaveChanges}
          disabled={isLoading || isUploadingLogo || isUploadingBanner || isUploadingCraftsmanshipImage || isUploadingHomePageAd || isUploadingCatalogPageAd || isDataLoading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {(isLoading || isUploadingLogo || isUploadingBanner || isUploadingCraftsmanshipImage || isUploadingHomePageAd || isUploadingCatalogPageAd) ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          {isUploadingLogo ? 'ლოგო იტვირთება...' :
           isUploadingBanner ? 'ბანერი იტვირთება...' :
           isUploadingCraftsmanshipImage ? 'ხელოსნ. სურათი იტვირთება...' :
           isUploadingHomePageAd ? 'მთავარი რეკ. სურათი იტვირთება...' :
           isUploadingCatalogPageAd ? 'კატ. რეკ. სურათი იტვირთება...' :
           isLoading ? 'მუშავდება...' :
           'ცვლილებების შენახვა'}
        </Button>
      </div>
    </div>
  );
}
    