
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Class, Student } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, ShieldAlert, KeyRound, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, getDocs, writeBatch, query, where, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsButton } from '@/components/admin/view-details-button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { secureCreateDocument, secureUpdateDocument, secureDeleteDocument } from '@/ai/flows/admin-actions';
import { signOut } from 'firebase/auth';

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
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const auth = useAuth();

  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading } = useCollection<AppUser>(usersCollectionRef);

  const classesCollectionRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesCollectionRef);
  
  React.useEffect(() => {
    const forceRefresh = async () => {
        const idTokenResult = await currentUser?.getIdTokenResult(true);
        const isAdmin = idTokenResult?.claims.admin === true;
        if (!isAdmin) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'avez pas les droits d'administrateur. Déconnexion...",
          });
          setTimeout(() => signOut(auth), 3000);
        }
    }
    if(currentUser) {
        forceRefresh();
    }
  }, [currentUser, auth, toast]);

  const handleUserAdded = async (userProfile: Omit<AppUser, 'id' | 'email' | 'username' | 'status' | 'createdAt' | 'creatorId'>) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour pré-inscrire un utilisateur.' });
        return;
    }
    
    const userProfileWithStatus = {
      ...userProfile,
      status: 'inactive' as const,
    };
    
    try {
        const result = await secureCreateDocument({
            collection: 'pending_users',
            userId: currentUser.uid,
            data: userProfileWithStatus
        });

        if (result.success) {
            toast({
              title: 'Utilisateur pré-inscrit !',
              description: `Le profil pour ${getDisplayName(userProfile)} a été créé. Il pourra s'inscrire pour l'activer.`,
            });
        } else {
            throw new Error(result.error || "La création a échoué via le flow sécurisé.");
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Échec de la pré-inscription",
            description: error.message || "Une erreur est survenue.",
            duration: 9000,
        });
    }
  };


  const handleUpdate = async (updatedUser: AppUser) => {
    if (!currentUser) return;
    const { id, ...userData } = updatedUser;
    
    if (userData.photo === '') {
      delete (userData as Partial<AppUser>).photo;
    }

    const result = await secureUpdateDocument({
      collection: 'users',
      docId: id,
      data: userData,
      userId: currentUser.uid
    });
    
    if (result.success) {
        toast({
          title: 'Utilisateur modifié',
          description: `L'utilisateur ${getDisplayName(updatedUser)} a été mis à jour.`,
        });
    } else {
        toast({ variant: 'destructive', title: 'Erreur de mise à jour', description: result.error });
    }
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
    if (!selectedUser || !currentUser) return;
    
    const userId = selectedUser.id;

    try {
        const batch = writeBatch(firestore);
        
        // Batch related document modifications. These don't need to be secure as they are cascading effects.
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
            // This part can be complex and might be better handled by a dedicated backend function in a real app
        }
        await batch.commit();

        // Perform the secure deletion of the user document
        const result = await secureDeleteDocument({
            collection: 'users',
            docId: userId,
            userId: currentUser.uid
        });

        if (result.success) {
            toast({
                variant: 'destructive',
                title: 'Utilisateur supprimé de Firestore',
                description: `Le profil de ${getDisplayName(selectedUser)} a été supprimé de la base de données.`,
            });
        } else {
            throw new Error(result.error || "La suppression sécurisée a échoué.");
        }
        
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);

    } catch (error: any) {
        console.error("Échec de la suppression de l'utilisateur:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de suppression',
            description: `La suppression a échoué: ${error.message}`,
        });
    }
  };
  
  const filteredUsers = React.useMemo(() => (users || []).filter(user =>
    (getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())))
  ), [users, searchTerm]);

  const isLoadingData = isLoading || isLoadingClasses;

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Action de suppression limitée</AlertTitle>
        <AlertDescription>
          La suppression d'un utilisateur est limitée à la base de données (Firestore). Le compte d'authentification ne sera pas supprimé en raison des restrictions de sécurité de l'environnement de développement. Après cette action, l'utilisateur concerné ne pourra plus se connecter.
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
              {isLoadingData ? (
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
                  const statusInfo = statusMap[user.status as 'active' | 'inactive'];
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
