
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Edit3, Trash2 } from 'lucide-react'; 
import Link from 'next/link'; 
import { useEffect, useState } from 'react';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdminPanelUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Helper to format Firestore Timestamp to readable date
const formatDetailDate = (timestamp?: Timestamp): string => { 
    if (!timestamp || typeof timestamp.toDate !== 'function') return "თარიღი უცნობია";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('ka-GE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "თარიღის ფორმატირების შეცდომა";
    }
};


export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { toast } = useToast();

  const [user, setUser] = useState<AdminPanelUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
        setError("მომხმარებლის ID არ არის მითითებული.");
        setIsLoading(false);
        return;
    };

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser({ firebaseId: userDocSnap.id, ...userDocSnap.data() } as AdminPanelUser);
        } else {
          setError("მომხმარებელი ვერ მოიძებნა.");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("მომხმარებლის დეტალების ჩატვირთვისას მოხდა შეცდომა.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">მომხმარებლის მონაცემები იტვირთება...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive mb-4">შეცდომა</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> მომხმარებლების სიაში დაბრუნება
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!user) {
     return ( 
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive mb-4">მომხმარებელი ვერ მოიძებნა</h1>
         <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> მომხმარებლების სიაში დაბრუნება
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">მომხმარებლის დეტალები</h1>
            <p className="text-muted-foreground">დეტალური ინფორმაცია მომხმარებლის შესახებ: {user.firstName} {user.lastName}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
             <ArrowLeft className="mr-2 h-4 w-4" /> უკან მომხმარებლებთან
          </Button>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>პირადი ინფორმაცია</CardTitle>
          <CardDescription>ID: {user.firebaseId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <p><strong>სახელი:</strong> {user.firstName}</p>
            <p><strong>გვარი:</strong> {user.lastName}</p>
            <p><strong>ელ. ფოსტა:</strong> {user.email}</p>
            <p><strong>ტელეფონის ნომერი:</strong> {user.phoneNumber || 'არ არის მითითებული'}</p>
            <p><strong>სქესი:</strong> {user.gender === 'male' ? 'კაცი' : user.gender === 'female' ? 'ქალი' : 'არ არის მითითებული'}</p>
            <p className="md:col-span-2"><strong>ავატარის URL:</strong> {user.avatarUrl ? <Link href={user.avatarUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{user.avatarUrl}</Link> : 'არ არის'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>მისამართის ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <p><strong>ქალაქი:</strong> {user.addressCity || 'არ არის მითითებული'}</p>
            <p><strong>საფოსტო ინდექსი:</strong> {user.postalCode || 'არ არის მითითებული'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>ანგარიშის ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
           <p><strong>რეგისტრაციის თარიღი:</strong> {formatDetailDate(user.createdAt)}</p>
           {/* TODO: Add more account info like roles, last login, status etc. when available */}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/admin/users/edit/${user.firebaseId}`}>
            <Edit3 className="mr-2 h-4 w-4" /> რედაქტირება
          </Link>
        </Button>
         <Button variant="destructive" onClick={() => toast({ title: "Auth-დან წაშლა", description: "მომხმარებლის Firebase Authentication-დან სრულად წაშლა მოითხოვს Admin SDK-ს და სერვერის მხარეს ლოგიკას. ეს ფუნქციონალი დაემატება შესაბამისი ინფრასტრუქტურის მოწყობის შემდეგ.", duration: 7000, variant: "default"})}>
          <Trash2 className="mr-2 h-4 w-4" /> Auth-დან წაშლა (მალე)
        </Button>
      </div>

    </div>
  );
}
