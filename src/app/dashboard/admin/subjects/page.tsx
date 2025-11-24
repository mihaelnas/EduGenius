
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Subject } from '@/lib/placeholder-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import Image from 'next/image';
import { AddSubjectDialog } from '@/components/admin/add-subject-dialog';
import { EditSubjectDialog } from '@/components/admin/edit-subject-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { AssignSubjectTeacherDialog } from '@/components/admin/assign-subject-teacher-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [allTeachers, setAllTeachers] = React.useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);

  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectsData, teachersData] = await Promise.all([
        apiFetch('/dashboard/admin/matieres'),
        apiFetch('/dashboard/admin/professeurs'),
      ]);
      setSubjects(subjectsData || []);
      setAllTeachers(teachersData || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de chargement',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (newSubject: Omit<Subject, 'id_matiere' | 'enseignant'>) => {
    try {
      await apiFetch('/dashboard/admin/matieres/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
      toast({ title: 'Matière ajoutée', description: `La matière ${newSubject.nom_matiere} a été créée.` });
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleUpdate = async (updatedSubjectData: Omit<Subject, 'id_matiere' | 'enseignant'>) => {
    if (!selectedSubject) return;
    try {
      await apiFetch(`/dashboard/admin/matieres/${selectedSubject.id_matiere}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSubjectData),
      });
      toast({ title: 'Matière modifiée', description: `La matière ${updatedSubjectData.nom_matiere} a été mise à jour.` });
      fetchData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };
  
  const handleAssignTeacher = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsAssignTeacherDialogOpen(true);
  };
  
  const handleAssignTeacherSave = async (subjectId: number, teacherId: number | undefined) => {
    if (!selectedSubject) return;
    const currentTeacherId = selectedSubject.id_enseignant;

    try {
        if (teacherId && teacherId !== currentTeacherId) {
            await apiFetch(`/dashboard/admin/matieres/assigner_enseignant/${subjectId}/${teacherId}`, { method: 'POST' });
        } else if (!teacherId && currentTeacherId) {
            await apiFetch(`/dashboard/admin/matieres/retirer_enseignant/${subjectId}/${currentTeacherId}`, { method: 'DELETE' });
        }
        toast({ title: 'Assignation réussie', description: `L'enseignant pour la matière a été mis à jour.` });
        fetchData();
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
        setIsAssignTeacherDialogOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (selectedSubject) {
        try {
            await apiFetch(`/dashboard/admin/matieres/${selectedSubject.id_matiere}`, { method: 'DELETE' });
            toast({ variant: 'destructive', title: 'Matière supprimée', description: `La matière "${selectedSubject.nom_matiere}" a été supprimée.` });
            fetchData();
        } catch(error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
        setIsDeleteDialogOpen(false);
        setSelectedSubject(null);
    }
  };

  const filteredSubjects = React.useMemo(() => subjects.filter(subject =>
    subject.nom_matiere.toLowerCase().includes(searchTerm.toLowerCase())
  ), [subjects, searchTerm]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Gestion des Matières</CardTitle>
                  <CardDescription>Créez des matières et assignez-les à des enseignants.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher des matières..." 
                        className="pl-8 sm:w-[300px]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <AddSubjectDialog 
                    isOpen={isAddDialogOpen}
                    setIsOpen={setIsAddDialogOpen}
                    onSubjectAdded={handleAdd}
                    allTeachers={allTeachers}
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la matière</TableHead>
                <TableHead>Crédits</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Enseignant assigné</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => {
                  const teacher = subject.enseignant;
                  return (
                  <TableRow key={subject.id_matiere}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {subject.photo_url ? (
                            <Image src={subject.photo_url} alt={subject.nom_matiere} width={40} height={40} className="rounded-sm object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center text-muted-foreground text-xs">IMG</div>
                        )}
                        <span>{subject.nom_matiere}</span>
                      </div>
                    </TableCell>
                    <TableCell>{subject.credit}</TableCell>
                    <TableCell>{subject.semestre}</TableCell>
                    <TableCell>{teacher ? getDisplayName(teacher) : 'Non assigné'}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(subject)}>Modifier les détails</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssignTeacher(subject)}>Assigner un enseignant</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(subject)}>Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucune matière trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedSubject && (
        <EditSubjectDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          subject={selectedSubject}
          onSubjectUpdated={handleUpdate}
        />
      )}
       {selectedSubject && (
        <AssignSubjectTeacherDialog
          isOpen={isAssignTeacherDialogOpen}
          setIsOpen={setIsAssignTeacherDialogOpen}
          subject={selectedSubject}
          allTeachers={allTeachers}
          onAssign={handleAssignTeacherSave}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedSubject?.nom_matiere}
        itemType="la matière"
      />
    </>
  );
}
