
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, ShieldAlert, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsButton } from '@/components/admin/view-details-button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const roleNames: Record<AppUser['role'], string> = {
  admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
};

const statusMap: Record<'active' | 'inactive', { text: string, className: string, icon?: React.ReactNode }> = {
    active: { text: 'Actif', className: 'bg-green-600', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
    inactive: { text: 'Inactif (pré-inscrit)', className: 'bg-yellow-500' },
};


export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
  
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading } = useCollection<AppUser>(usersCollectionRef);

  const handleUserAdded = async (userProfile: Omit<AppUser, 'id' | 'email' | 'username' | 'status' | 'createdAt' | 'creatorId'>) => {
    if (!currentUser) return;
    
    const userProfileWithStatus = {
      ...userProfile,
      status: 'inactive' as const,
      creatorId: currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    const pendingUsersRef = collection(firestore, 'pending_users');
    addDoc(pendingUsersRef, userProfileWithStatus).then(() => {
        toast({
          title: 'Utilisateur pré-inscrit !',
          description: `Le profil pour ${getDisplayName(userProfile)} a été créé. Il pourra s'inscrire pour l'activer.`,
        });
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
            path: pendingUsersRef.path,
            operation: 'create',
            requestResourceData: userProfileWithStatus,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };


  const handleUpdate = async (updatedUser: AppUser) => {
    const { id, ...userData } = updatedUser;
    
    if (userData.photo === '') {
      delete (userData as Partial<AppUser>).photo;
    }
    
    const userDocRef = doc(firestore, 'users', id);
    updateDoc(userDocRef, userData).then(() => {
       toast({
          title: 'Utilisateur modifié',
          description: `L'utilisateur ${getDisplayName(updatedUser)} a été mis à jour.`,
        });
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
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
    
    const userDocRef = doc(firestore, 'users', selectedUser.id);
    deleteDoc(userDocRef).then(() => {
        toast({
            variant: 'destructive',
            title: 'Utilisateur supprimé',
            description: `Le profil de ${getDisplayName(selectedUser)} a été supprimé.`,
        });
    }).catch(e => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  
  const filteredUsers = React.useMemo(() => (users || []).filter(user =>
    (getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())))
  ), [users, searchTerm]);


  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Action de suppression limitée</AlertTitle>
        <AlertDescription>
          La suppression d'un utilisateur est limitée à la base de données (Firestore). Le compte d'authentification ne sera pas supprimé.
        </AlertDescription>
      </Alert>
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
                    onUserAdded={handleUserAdded}
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
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredUsers.map((user) => {
                  const statusInfo = user.status === 'active' ? statusMap.active : statusMap.inactive;
                  return (
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
                       <Badge variant={'outline'} className={statusInfo?.className}>
                          {statusInfo?.icon}
                          {statusInfo?.text}
                        </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'd MMMM yyyy', { locale: fr }) : '-'}</TableCell>
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
                )})
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
        itemType="l'utilisateur"
      />
    </>
  );
}
