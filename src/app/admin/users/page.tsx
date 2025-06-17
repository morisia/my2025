
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { MoreHorizontal, Eye, Search, Loader2, AlertTriangle, Trash2, UserPlus, FileText, Users, Edit } from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { collection, getDocs, query, orderBy as firestoreOrderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { AdminPanelUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Helper to get initials from names
const getInitials = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }
  if (firstName) {
    return `${firstName[0] || ''}${firstName.length > 1 ? firstName[1] : ''}`.toUpperCase();
  }
  return "??";
};

// Helper to format Firestore Timestamp to readable date
const formatJoinDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return "თარიღი უცნობია";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('ka-GE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "თარიღის ფორმატირების შეცდომა";
    }
};


export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminPanelUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<AdminPanelUser | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, firestoreOrderBy('createdAt', 'desc'));
      const userSnapshot = await getDocs(q);
      const usersList = userSnapshot.docs.map(docSnapshot => ({
        firebaseId: docSnapshot.id,
        ...(docSnapshot.data() as Omit<AdminPanelUser, 'firebaseId'>)
      }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("მომხმარებლების ჩატვირთვისას მოხდა შეცდომა.");
      toast({
        title: "ჩატვირთვის შეცდომა",
        description: "მომხმარებლების სიის წამოღება ვერ მოხერხდა.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeleteConfirmation = (user: AdminPanelUser) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.firebaseId));
      toast({
        title: "მომხმარებლის მონაცემები წაშლილია",
        description: `მომხმარებლის "${userToDelete.firstName} ${userToDelete.lastName}" მონაცემები წარმატებით წაიშალა Firestore-დან.`,
      });
    } catch (err) {
      console.error("Error deleting user document:", err);
      toast({
        title: "წაშლის შეცდომა",
        description: "მომხმარებლის დოკუმენტის წაშლისას მოხდა შეცდომა.",
        variant: "destructive",
      });
    } finally {
      fetchUsers(); 
      setIsAlertOpen(false);
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">მომხმარებლების მართვა</h1>
          <p className="text-muted-foreground">დაათვალიერეთ და მართეთ რეგისტრირებული მომხმარებლები.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => toast({ title: "მალე დაემატება", description: "ახალი მომხმარებლის დამატების ფუნქცია მალე იქნება ხელმისაწვდომი."})}>
          <UserPlus className="mr-2 h-5 w-5" /> ახალი მომხმარებლის დამატება
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>მომხმარებლების სია</CardTitle>
          <CardDescription>
            ყველა რეგისტრირებული მომხმარებელი პლატფორმაზე.
          </CardDescription>
          <div className="pt-4 flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="მომხმარებლების ძიება (სახელი, გვარი, ელ.ფოსტა)..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => toast({ title: "მალე დაემატება", description: "მონაცემების ექსპორტის ფუნქცია მალე იქნება ხელმისაწვდომი."})}>
                <FileText className="mr-2 h-4 w-4" /> ექსპორტი (მალე)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">მომხმარებლები იტვირთება...</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="flex flex-col items-center justify-center py-10 text-destructive">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p className="text-lg font-semibold">შეცდომა!</p>
                <p>{error}</p>
             </div>
          )}
          {!isLoading && !error && users.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p>მომხმარებლები ვერ მოიძებნა.</p>
              <p className="text-sm">სისტემაში ჯერ არ არის რეგისტრირებული მომხმარებელი.</p>
            </div>
          )}
          {!isLoading && !error && users.length > 0 && filteredUsers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2" />
                <p>თქვენი ძიების შესაბამისი მომხმარებელი ვერ მოიძებნა.</p>
            </div>
          )}

          {!isLoading && !error && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[64px] sm:table-cell">ავატარი</TableHead>
                  <TableHead>სრული სახელი</TableHead>
                  <TableHead>ელ. ფოსტა</TableHead>
                  <TableHead className="hidden md:table-cell">სტატუსი</TableHead>
                  <TableHead className="hidden lg:table-cell">შემოუერთდა</TableHead>
                  <TableHead>
                    <span className="sr-only">მოქმედებები</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                    <TableRow key={user.firebaseId}>
                      <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(user.firstName, user.lastName)}`} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="profile avatar" />
                          <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30">აქტიური</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatJoinDate(user.createdAt)}</TableCell>
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
                               <Link href={`/admin/users/${user.firebaseId}`} className="flex items-center w-full cursor-pointer">
                                 <Eye className="mr-2 h-4 w-4" /> დეტალები
                               </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                               <Link href={`/admin/users/edit/${user.firebaseId}`} className="flex items-center w-full cursor-pointer">
                                 <Edit className="mr-2 h-4 w-4" /> რედაქტირება
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteConfirmation(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> მონაცემების წაშლა (DB)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                )}
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
              ნამდვილად გსურთ მომხმარებლის "{userToDelete?.firstName} {userToDelete?.lastName}"-ს მონაცემების წაშლა Firestore მონაცემთა ბაზიდან? ეს მოქმედება შეუქცევადია. (ეს არ წაშლის მომხმარებელს Firebase Authentication-დან).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

