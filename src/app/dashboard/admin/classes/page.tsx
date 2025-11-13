
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Class } from '@/lib/placeholder-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import { AddClassDialog } from '@/components/admin/add-class-dialog';
import { EditClassDialog } from '@/components/admin/edit-class-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { AssignTeacherDialog } from '@/components/admin/assign-teacher-dialog';
import { ManageStudentsDialog } from '@/components/admin/manage-students-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';

export default function AdminClassesPage() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [classesData, teachersData, studentsData] = await Promise.all([
        apiFetch('/admin/classes'),
        apiFetch('/admin/professeurs'),
        apiFetch('/admin/etudiants'),
      ]);
      setClasses(classesData || []);
      setUsers([...(teachersData || []), ...(studentsData || [])]);
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

  const allTeachers = React.useMemo(() => users.filter(u => u.role === 'enseignant'), [users]);
  const allStudents = React.useMemo(() => users.filter(u => u.role === 'etudiant'), [users]);

  const handleAdd = async (newClass: Omit<Class, 'id_classe' | 'enseignants' | 'effectif'> & {id_enseignant: number[]}) => {
    try {
      await apiFetch('/admin/creer_classe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });
      toast({ title: 'Classe ajoutée', description: `La classe ${newClass.nom_classe} a été créée.` });
      fetchData();
    } catch(error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleUpdate = async (updatedClass: Class) => {
    if (!selectedClass) return;
    try {
      await apiFetch(`/admin/modifier_classe/${selectedClass.id_classe}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nom_classe: updatedClass.nom_classe,
            niveau: updatedClass.niveau,
            filiere: updatedClass.filiere,
            annee_scolaire: updatedClass.annee_scolaire,
            id_enseignant: updatedClass.enseignants.map(e => e.id)
        }),
      });
      toast({ title: 'Classe modifiée', description: `La classe ${updatedClass.nom_classe} a été mise à jour.` });
      fetchData();
    } catch(error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleAssignTeachers = async (classId: number, teacherIds: number[]) => {
    if(!selectedClass) return;
    
    const initialTeacherIds = selectedClass.enseignants.map(t => t.id);
    const teachersToAdd = teacherIds.filter(id => !initialTeacherIds.includes(id));
    const teachersToRemove = initialTeacherIds.filter(id => !teacherIds.includes(id));

    try {
        await Promise.all([
            ...teachersToAdd.map(id => apiFetch(`/admin/assigner_enseignant/${classId}/${id}`, { method: 'POST' })),
            ...teachersToRemove.map(id => apiFetch(`/admin/retirer_enseignant/${classId}/${id}`, { method: 'DELETE' })),
        ]);

        toast({
            title: 'Assignation réussie',
            description: `Les enseignants pour la classe ${selectedClass.nom_classe} ont été mis à jour.`,
        });
        fetchData();
        setIsAssignTeacherDialogOpen(false);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleUpdateStudents = async (classId: number, studentIds: number[]) => {
      if(!selectedClass) return;
      // Fetch current students of the class to be sure
      const currentStudentsInClass = await apiFetch(`/admin/etudiants_classe/${classId}`);
      const currentStudentIds = currentStudentsInClass.map((s: AppUser) => s.id);
      
      const studentsToAdd = studentIds.filter(id => !currentStudentIds.includes(id));
      const studentsToRemove = currentStudentIds.filter(id => !studentIds.includes(id));

      try {
        await Promise.all([
          ...studentsToAdd.map(id => apiFetch(`/admin/ajouter_etudiant/${classId}/${id}`, { method: 'POST' })),
          ...studentsToRemove.map(id => apiFetch(`/admin/retirer_etudiant/${classId}/${id}`, { method: 'DELETE' })),
        ]);
         toast({
          title: 'Étudiants mis à jour',
          description: `La liste des étudiants pour la classe ${selectedClass.nom_classe} a été mise à jour.`,
        });
        fetchData();
        setIsManageStudentsDialogOpen(false);
      } catch(error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      }
  };

  const handleEdit = (c: Class) => {
    setSelectedClass(c);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (c: Class) => {
    setSelectedClass(c);
    setIsDeleteDialogOpen(true);
  };

  const handleAssignTeacherClick = (c: Class) => {
    setSelectedClass(c);
    setIsAssignTeacherDialogOpen(true);
  };

  const handleManageStudentsClick = (c: Class) => {
    setSelectedClass(c);
    setIsManageStudentsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClass) {
        try {
            await apiFetch(`/admin/supprimer_classe/${selectedClass.id_classe}`, { method: 'DELETE' });
            toast({ variant: 'destructive', title: 'Classe supprimée', description: `La classe "${selectedClass.nom_classe}" a été supprimée.` });
            fetchData();
        } catch(error: any) {
             toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
    }
  };
  
  const filteredClasses = React.useMemo(() => classes.filter(c =>
    c.nom_classe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.filiere.toLowerCase().includes(searchTerm.toLowerCase())
  ), [classes, searchTerm]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
              <div>
                  <CardTitle className="font-headline">Gestion des Classes</CardTitle>
                  <CardDescription>Gérez les classes, assignez des enseignants et inscrivez des étudiants.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher par nom, filière..." 
                        className="pl-8 sm:w-[300px]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <AddClassDialog 
                    isOpen={isAddDialogOpen}
                    setIsOpen={setIsAddDialogOpen}
                    onClassAdded={handleAdd}
                    allTeachers={allTeachers}
                   />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la classe</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Enseignant(s)</TableHead>
                <TableHead>Effectif</TableHead>
                <TableHead>Année Scolaire</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClasses.length > 0 ? (filteredClasses.map((c) => (
                <TableRow key={c.id_classe}>
                  <TableCell className="font-medium">{c.nom_classe}</TableCell>
                  <TableCell>{c.niveau}</TableCell>
                  <TableCell>{c.filiere}</TableCell>
                  <TableCell>
                     <div className="flex flex-wrap gap-1">
                      {c.enseignants && c.enseignants.length > 0 ? (
                        c.enseignants.map(teacher => (
                          <Badge key={teacher.id} variant="secondary">{getDisplayName(teacher)}</Badge>
                        ))
                      ) : (
                        'Non assigné'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.effectif}</TableCell>
                  <TableCell>{c.annee_scolaire}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(c)}>Modifier les détails</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignTeacherClick(c)}>Gérer les enseignants</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageStudentsClick(c)}>Gérer les étudiants</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c)}>Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune classe trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedClass && (
        <EditClassDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          classData={selectedClass}
          allTeachers={allTeachers}
          onClassUpdated={async (updatedData) => {
            await handleUpdate({ ...selectedClass, ...updatedData });
          }}
        />
      )}
       {selectedClass && (
        <AssignTeacherDialog
          isOpen={isAssignTeacherDialogOpen}
          setIsOpen={setIsAssignTeacherDialogOpen}
          classData={selectedClass}
          allTeachers={allTeachers}
          onAssign={handleAssignTeachers}
        />
      )}
      {selectedClass && (
        <ManageStudentsDialog
          isOpen={isManageStudentsDialogOpen}
          setIsOpen={setIsManageStudentsDialogOpen}
          classData={selectedClass}
          allStudents={allStudents}
          onUpdate={handleUpdateStudents}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedClass?.nom_classe}
        itemType="la classe"
      />
    </>
  );
}
