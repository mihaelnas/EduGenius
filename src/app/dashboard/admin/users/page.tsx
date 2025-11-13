
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
import { AddUserDialog, AddUserFormValues } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewDetailsButton } from '@/components/admin/view-details-button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const roleNames: Record<AppUser['role'], string> = {
  admin: 'Administrateur',
  enseignant: 'Enseignant',
  etudiant: 'Étudiant',
};

const statusMap: Record<AppUser['statut'], { text: string, className: string, icon?: React.ReactNode }> = {
    actif: { text: 'Actif', className: 'bg-green-600', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
    inactif: { text: 'Inactif', className: 'bg-yellow-500' },
};


export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // On récupère les deux listes en parallèle pour plus d'efficacité
      const [students, teachers] = await Promise.all([
        apiFetch('/admin/etudiants'),
        apiFetch('/admin/professeurs')
      ]);
      setUsers([...(students || []), ...(teachers || [])]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur lors de la récupération des utilisateurs',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAdded = async (values: AddUserFormValues) => {
    try {
      let endpoint: string;
      let payload: any;

      const userData = {
        nom: values.nom,
        prenom: values.prenom,
        nom_utilisateur: values.nom_utilisateur,
        email: values.email,
        mot_de_passe: values.mot_de_passe,
      };

      if (values.role === 'etudiant') {
        endpoint = '/admin/ajouter_etudiant';
        payload = {
          user: userData,
          etudiant: {
            matricule: values.matricule.toUpperCase(),
            date_naissance: values.date_naissance,
            lieu_naissance: values.lieu_naissance,
            genre: values.genre,
            adresse: values.adresse,
            niveau_etude: values.niveau,
            telephone: values.telephone,
            filiere: values.filiere,
            photo_url: values.photo_url
          }
        };
      } else { // 'enseignant'
        endpoint = '/admin/ajouter_professeur';
         payload = {
          user: userData,
          enseignant: {
            specialite: values.specialite,
            email_professionnel: values.email_professionnel,
            genre: values.genre,
            telephone: values.telephone,
            adresse: values.adresse,
            photo_url: values.photo_url
          }
        };
      }

      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast({
        title: 'Utilisateur ajouté avec succès !',
        description: `Le profil pour ${getDisplayName(values)} a été créé.`,
      });
      fetchUsers(); // Recharger la liste des utilisateurs
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Erreur lors de l'ajout de l'utilisateur",
        description: error.message,
      });
    }
  };

  const handleUpdate = async (updatedUser: AppUser, updates: any) => {
    try {
      const isStudent = updatedUser.role === 'etudiant';
      const endpoint = isStudent ? `/admin/modifier_etudiant/${updatedUser.id}` : `/admin/modifier_professeur/${updatedUser.id}`;
      
      const payload = isStudent ? 
        { user_update: updates.user_update, etudiant_update: updates.specific_update } :
        { user_update: updates.user_update, enseignant_update: updates.specific_update };

      await apiFetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      toast({
          title: 'Utilisateur modifié',
          description: `Le profil de ${getDisplayName(updatedUser)} a été mis à jour.`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur lors de la modification',
        description: error.message,
      });
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
    if (!selectedUser) return;
    
    const endpoint = selectedUser.role === 'etudiant' 
      ? `/admin/supprimer_etudiant/${selectedUser.id}`
      : `/admin/supprimer_professeur/${selectedUser.id}`;

    try {
      await apiFetch(endpoint, { method: 'DELETE' });
      toast({
          variant: 'destructive',
          title: 'Utilisateur supprimé',
          description: `Le profil de ${getDisplayName(selectedUser)} a été supprimé.`,
      });
      fetchUsers();
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Erreur lors de la suppression',
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  const filteredUsers = React.useMemo(() => users.filter(user =>
    (getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())))
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
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const statusInfo = user.statut === 'actif' ? statusMap.actif : statusMap.inactif;
                  return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           {/* @ts-ignore */}
                          <AvatarImage src={user.photo_url} alt={getDisplayName(user)} />
                          <AvatarFallback>{(user.prenom || 'U').charAt(0)}{(user.nom || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                            <span className="font-semibold">{getDisplayName(user)}</span>
                            <span className="text-xs text-muted-foreground">{user.nom_utilisateur}</span>
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
                    <TableCell>{user.cree_a ? format(new Date(user.cree_a), 'd MMMM yyyy', { locale: fr }) : '-'}</TableCell>
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
                          {/* <ViewDetailsButton userId={user.id} /> */}
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDelete(user)}
                            disabled={currentUser?.id === user.id}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Aucun utilisateur trouvé.
                    </TableCell>
                </TableRow>
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
