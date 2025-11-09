
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Class } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddUserDialog, AddUserFormValues } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch, updateDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsButton } from '@/components/admin/view-details-button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

const roleNames: Record<AppUser['role'], string> = {
  admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
};

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading } = useCollection<AppUser>(usersCollectionRef);

  const handleAdd = async (values: AddUserFormValues) => {
    const { password, confirmPassword, ...userData } = values;
    
    // Create a temporary, secondary Firebase app instance for user creation.
    // This prevents the current admin user from being signed out.
    const tempAuthApp = initializeApp(firebaseConfig, `temp-app-${Date.now()}`);
    const tempAuth = getAuth(tempAuthApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, password);
      const newUser = userCredential.user;

      const userProfile: AppUser = {
        id: newUser.uid,
        ...userData,
        status: 'active',
        createdAt: new Date().toISOString(),
      } as AppUser;
      
      if (!userProfile.photo) {
        delete (userProfile as Partial<AppUser>).photo;
      }
      
      const userDocRef = doc(firestore, 'users', newUser.uid);
      
      await setDoc(userDocRef, userProfile);
      
      toast({
        title: `Utilisateur ${getDisplayName(values)} ajouté.`,
      });

    } catch (error: any) {
      console.error("Erreur de création d'utilisateur:", error);
       if (error.code === 'auth/email-already-in-use') {
        toast({
            variant: 'destructive',
            title: 'Échec de la création',
            description: 'Cette adresse e-mail est déjà utilisée.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Échec de la création',
          description: error.message || "Une erreur inconnue est survenue.",
        });
      }
    }
  };


  const handleUpdate = async (updatedUser: AppUser) => {
    const { id, ...userData } = updatedUser;
    
    // Update Firestore document
    const userDocRef = doc(firestore, 'users', id);
    if (userData.photo === '') {
      delete (userData as Partial<AppUser>).photo;
    }

    await updateDoc(userDocRef, userData);
    toast({
      title: 'Utilisateur modifié',
      description: `L'utilisateur ${getDisplayName(updatedUser)} a été mis à jour.`,
    });
  };

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: AppUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    const userId = selectedUser.id;

    try {
        // 1. Delete Auth User via API route
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'La suppression de l\'utilisateur d\'authentification a échoué.');
        }

        // 2. If Auth deletion is successful, proceed with Firestore cleanup in a batch
        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, 'users', userId);

        if (selectedUser.role === 'student') {
            const classesRef = collection(firestore, 'classes');
            const q = query(classesRef, where('studentIds', 'array-contains', userId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const data = doc.data() as Class;
                batch.update(doc.ref, { studentIds: data.studentIds.filter(id => id !== userId) });
            });
        }
        
        if (selectedUser.role === 'teacher') {
            const classesRef = collection(firestore, 'classes');
            const qClasses = query(classesRef, where('teacherIds', 'array-contains', userId));
            const snapshotClasses = await getDocs(qClasses);
            snapshotClasses.forEach(doc => {
                const data = doc.data() as Class;
                batch.update(doc.ref, { teacherIds: data.teacherIds.filter(id => id !== userId) });
            });

            const subjectsRef = collection(firestore, 'subjects');
            const qSubjects = query(subjectsRef, where('teacherId', '==', userId));
            const snapshotSubjects = await getDocs(qSubjects);
            snapshotSubjects.forEach(doc => batch.update(doc.ref, { teacherId: '' }));

            const coursesRef = collection(firestore, 'courses');
            const qCourses = query(coursesRef, where('teacherId', '==', userId));
            const snapshotCourses = await getDocs(qCourses);
            snapshotCourses.forEach(doc => batch.delete(doc.ref));

            const scheduleRef = collection(firestore, 'schedule');
            const qSchedule = query(scheduleRef, where('teacherId', '==', userId));
            const snapshotSchedule = await getDocs(qSchedule);
            snapshotSchedule.forEach(doc => batch.delete(doc.ref));
        }

        batch.delete(userDocRef);
        await batch.commit();

        toast({
            variant: 'destructive',
            title: 'Utilisateur supprimé',
            description: `Le compte et les données de ${getDisplayName(selectedUser)} ont été supprimés.`,
        });

    } catch (error: any) {
        console.error("Échec de la suppression de l'utilisateur:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de suppression',
            description: `La suppression a échoué: ${error.message}`,
        });
    }

    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = React.useMemo(() => (users || []).filter(user =>
    getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Gestion des Utilisateurs</CardTitle>
                  <CardDescription>Créez, affichez et gérez tous les utilisateurs de la plateforme.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher par nom ou email..." 
                        className="pl-8 sm:w-[300px]" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <AddUserDialog 
                    isOpen={isAddDialogOpen}
                    setIsOpen={setIsAddDialogOpen}
                    onUserAdded={handleAdd}
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.photo} alt={getDisplayName(user)} />
                          <AvatarFallback>{(user.firstName || 'U').charAt(0)}{(user.lastName || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                            <span className="font-semibold">{getDisplayName(user)}</span>
                            <span className="text-xs text-muted-foreground">{user.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{roleNames[user.role]}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}>
                        {user.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'd MMMM yyyy', { locale: fr })}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>Modifier</DropdownMenuItem>
                          <ViewDetailsButton userId={user.id} />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDelete(user)}
                            disabled={currentUser?.uid === user.id}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedUser && (
        <EditUserDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          user={selectedUser}
          onUserUpdated={handleUpdate}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedUser ? getDisplayName(selectedUser) : ''}
        itemType="l'utilisateur et son compte d'authentification"
      />
    </>
  );
}
