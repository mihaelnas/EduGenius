
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { AuthorizedStudent, AppUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddAuthorizedStudentDialog, AddAuthorizedStudentFormValues } from '@/components/admin/add-authorized-student-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { getDisplayName } from '@/lib/placeholder-data';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function AuthorizedStudentsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<AuthorizedStudent | null>(null);

  const { user: currentUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => currentUser ? doc(firestore, 'users', currentUser.uid) : null, [firestore, currentUser]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userDocRef);

  const isUserAdmin = userProfile?.role === 'admin';

  const authorizedStudentsCollectionRef = useMemoFirebase(
    () => isUserAdmin ? collection(firestore, 'authorized_students') : null,
    [firestore, isUserAdmin]
  );

  const { data: students, isLoading: isLoadingStudents } = useCollection<AuthorizedStudent>(authorizedStudentsCollectionRef);

  const isLoading = isUserLoading || isProfileLoading || (isUserAdmin && isLoadingStudents);

  const handleAdd = async (values: AddAuthorizedStudentFormValues) => {
    if (!authorizedStudentsCollectionRef) return;
    try {
      await addDoc(authorizedStudentsCollectionRef, {
        ...values,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: 'Étudiant ajouté à la liste',
        description: `${getDisplayName(values)} peut maintenant s'inscrire.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'ajouter l'étudiant. " + error.message,
      });
    }
  };

  const handleDelete = (student: AuthorizedStudent) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedStudent) {
      const studentDocRef = doc(firestore, 'authorized_students', selectedStudent.id);
      await deleteDoc(studentDocRef);
      toast({
        variant: 'destructive',
        title: 'Étudiant retiré',
        description: `${getDisplayName(selectedStudent)} a été retiré de la liste d'admission.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const filteredStudents = React.useMemo(() => (students || []).filter(student =>
    getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  ), [students, searchTerm]);

  if (!isUserLoading && !isProfileLoading && !isUserAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Accès Refusé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Liste d'Admission des Étudiants</CardTitle>
              <CardDescription>
                Gérez la liste des étudiants qui sont autorisés à s'inscrire. Les comptes correspondants seront validés automatiquement.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou matricule..."
                  className="pl-8 sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <AddAuthorizedStudentDialog
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                onStudentAdded={handleAdd}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Ajouté le</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs">{student.matricule}</TableCell>
                    <TableCell>{student.firstName}</TableCell>
                    <TableCell>{student.lastName}</TableCell>
                    <TableCell>{format(new Date(student.createdAt), 'd MMMM yyyy', { locale: fr })}</TableCell>
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
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student)}>
                            Supprimer de la liste
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && filteredStudents.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">Aucun étudiant dans la liste d'admission.</p>
          )}
        </CardContent>
      </Card>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedStudent ? getDisplayName(selectedStudent) : ''}
        itemType="l'étudiant de la liste d'admission"
      />
    </>
  );
}
