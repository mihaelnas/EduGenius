
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Class } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, ShieldAlert, KeyRound, Clock, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddUserDialog, AddUserFormValues } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsButton } from '@/components/admin/view-details-button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const roleNames: Record<AppUser['role'], string> = {
  admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
};

const statusMap: Record<AppUser['status'], { text: string, className: string, icon?: React.ReactNode }> = {
    active: { text: 'Actif', className: 'bg-green-600' },
    inactive: { text: 'Inactif', className: 'bg-gray-400' },
    pending: { text: 'En attente', className: 'bg-yellow-500', icon: <Clock className="mr-1 h-3 w-3" /> }
}


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


  const handleAdd = async (values: AddUserFormValues) => {
    const { password, confirmPassword, ...userData } = values;
    
    // Create a temporary auth instance to avoid conflicts with the main app's auth state
    const tempAuthApp = initializeApp(firebaseConfig, `temp-app-${Date.now()}`);
    const tempAuth = getAuth(tempAuthApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, password);
      const newUser = userCredential.user;

      const userProfile: AppUser = {
        id: newUser.uid,
        ...userData,
        status: 'active', // Admins/Teachers created manually are active by default
        createdAt: new Date().toISOString(),
      } as AppUser;
      
      if (!userProfile.photo) {
        delete (userProfile as Partial<AppUser>).photo;
      }
      
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', newUser.uid);
      batch.set(userDocRef, userProfile);
      
      // If the new user is an admin, add them to the roles_admin collection
      if (userProfile.role === 'admin') {
          const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
          batch.set(adminRoleRef, { uid: newUser.uid });
      }

      await batch.commit();
      
      toast({
        title: `Utilisateur ${getDisplayName(values)} ajouté.`,
      });
      setIsAddDialogOpen(false);

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
      throw error; // Re-throw to prevent dialog from closing on error
    }
  };


  const handleUpdate = async (updatedUser: AppUser) => {
    const { id, ...userData } = updatedUser;
    
    const batch = writeBatch(firestore);
    const userDocRef = doc(firestore, 'users', id);

    if (userData.photo === '') {
      delete (userData as Partial<AppUser>).photo;
    }
    
    batch.update(userDocRef, userData);

    const adminRoleRef = doc(firestore, 'roles_admin', id);
    if(userData.role === 'admin') {
      batch.set(adminRoleRef, { uid: id });
    } else {
      batch.delete(adminRoleRef);
    }
    
    await batch.commit();

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

  const handleActivateStudent = async (userToActivate: AppUser) => {
    if (userToActivate.role !== 'student' || userToActivate.status !== 'pending' || !classes) return;

    const student = userToActivate as any; // Cast to access student properties
    const className = `${student.niveau} - ${student.filiere}`;
    const targetClass = classes.find(c => c.name === className);

    if (!targetClass) {
        toast({
            variant: 'destructive',
            title: 'Erreur d\'activation',
            description: `La classe "${className}" n'a pas été trouvée. Impossible d'activer l'étudiant.`,
        });
        return;
    }

    try {
        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, 'users', student.id);
        const classDocRef = doc(firestore, 'classes', targetClass.id);

        batch.update(userDocRef, { status: 'active' });
        batch.update(classDocRef, { studentIds: arrayUnion(student.id) });

        await batch.commit();

        toast({
            title: 'Étudiant activé',
            description: `${getDisplayName(student)} a été activé et assigné à la classe ${targetClass.name}.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: error.message || "Une erreur est survenue lors de l'activation.",
        });
    }
  };


  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    const userId = selectedUser.id;

    try {
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

        if (selectedUser.role === 'admin') {
            const adminRoleRef = doc(firestore, 'roles_admin', userId);
            batch.delete(adminRoleRef);
        }

        batch.delete(userDocRef);
        await batch.commit();

        toast({
            variant: 'destructive',
            title: 'Utilisateur supprimé de Firestore',
            description: `Le profil de ${getDisplayName(selectedUser)} a été supprimé de la base de données.`,
        });
        
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);

    } catch (error: any) {
        console.error("Échec de la suppression de l'utilisateur de Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de suppression Firestore',
            description: `La suppression a échoué: ${error.message}`,
        });
    }
  };

  const filteredUsers = React.useMemo(() => (users || []).filter(user =>
    getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                       <Badge variant={'outline'} className={statusMap[user.status].className}>
                          {statusMap[user.status].icon}
                          {statusMap[user.status].text}
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
                          {user.role === 'student' && user.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleActivateStudent(user)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activer et Assigner
                            </DropdownMenuItem>
                          )}
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
        itemType="l'utilisateur"
      />
    </>
  );
}
