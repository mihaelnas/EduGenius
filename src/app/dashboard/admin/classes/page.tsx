
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
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { secureCreateDocument, secureUpdateDocument, secureDeleteDocument, secureGetDocuments } from '@/app/actions';

export default function AdminClassesPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const { toast } = useToast();
  const { user: currentUser } = useUser();

  React.useEffect(() => {
    async function fetchData() {
        if (!currentUser) return;
        setIsLoading(true);
        const [classesResult, usersResult] = await Promise.all([
            secureGetDocuments<Class>('classes'),
            secureGetDocuments<AppUser>('users')
        ]);

        if (classesResult.success && classesResult.data) {
            setClasses(classesResult.data);
        } else {
            toast({ variant: 'destructive', title: 'Erreur de chargement des classes', description: classesResult.error });
        }

        if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data);
        } else {
            toast({ variant: 'destructive', title: 'Erreur de chargement des utilisateurs', description: usersResult.error });
        }
        setIsLoading(false);
    }

    if (currentUser) {
        fetchData();
    }
  }, [currentUser, toast]);


  const allTeachers = React.useMemo(() => users.filter(u => u.role === 'teacher'), [users]);
  const allStudents = React.useMemo(() => users.filter(u => u.role === 'student'), [users]);

  const handleAdd = async (newClass: Omit<Class, 'id' | 'teacherIds' | 'studentIds' | 'createdAt' | 'creatorId'>) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer une classe.' });
        return;
    }
    const newClassData = {
        ...newClass,
        teacherIds: [],
        studentIds: [],
    };
    
    const result = await secureCreateDocument('classes', newClassData);

    if (result.success && result.id) {
        toast({ title: 'Classe ajoutée', description: `La classe ${newClass.name} a été créée.` });
        setClasses(prev => [...prev, { ...newClassData, id: result.id!, createdAt: new Date().toISOString(), creatorId: currentUser.uid }]);
    } else {
        toast({ variant: 'destructive', title: 'Échec de la création', description: result.error });
    }
  };

  const handleUpdate = async (updatedClass: Class) => {
     if (!currentUser) return;
    const { id, ...classData } = updatedClass;
    
    const result = await secureUpdateDocument('classes', id, classData);

    if (result.success) {
        toast({ title: 'Classe modifiée', description: `La classe ${updatedClass.name} a été mise à jour.` });
        setClasses(prev => prev.map(c => c.id === id ? { ...c, ...classData } : c));
    } else {
        toast({ variant: 'destructive', title: 'Erreur de mise à jour', description: result.error });
    }
  };
  
  const handleUpdatePartial = async (classId: string, data: Partial<Omit<Class, 'id'>>) => {
     if (!currentUser) return;
     const result = await secureUpdateDocument('classes', classId, data);
     if (result.success) {
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, ...data } : c));
     } else {
        toast({ variant: 'destructive', title: 'Erreur de mise à jour', description: result.error });
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

  const handleAssignTeacher = (c: Class) => {
    setSelectedClass(c);
    setIsAssignTeacherDialogOpen(true);
  };

  const handleManageStudents = (c: Class) => {
    setSelectedClass(c);
    setIsManageStudentsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClass && currentUser) {
        // Complex logic like deleting related documents should be a single server action
        const result = await secureDeleteDocument('classes', selectedClass.id);

        if (result.success) {
            toast({ variant: 'destructive', title: 'Classe supprimée', description: `La classe "${selectedClass.name}" a été supprimée.` });
            setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
        } else {
            toast({ variant: 'destructive', title: 'Erreur de suppression', description: result.error });
        }

        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
    }
  };
  
  const getTeacherById = (id: string): AppUser | undefined => users.find(u => u.id === id);

  const filteredClasses = React.useMemo(() => classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <TableHead>Groupe</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (filteredClasses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.niveau}</TableCell>
                  <TableCell>{c.filiere}</TableCell>
                  <TableCell>{c.groupe}</TableCell>
                  <TableCell>
                     <div className="flex flex-wrap gap-1">
                      {c.teacherIds.length > 0 ? (
                        c.teacherIds.map(teacherId => {
                          const teacher = getTeacherById(teacherId);
                          return teacher ? <Badge key={teacherId} variant="secondary">{getDisplayName(teacher)}</Badge> : null;
                        })
                      ) : (
                        'Non assigné'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.studentIds.length}</TableCell>
                  <TableCell>{c.anneeScolaire}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleAssignTeacher(c)}>Assigner un enseignant</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageStudents(c)}>Gérer les étudiants</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c)}>Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedClass && (
        <EditClassDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          classData={selectedClass}
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
          onAssign={async (classId, teacherIds) => {
            await handleUpdatePartial(classId, { teacherIds });
            toast({
              title: 'Assignation réussie',
              description: `Les enseignants pour la classe ${selectedClass.name} ont été mis à jour.`,
            });
            setIsAssignTeacherDialogOpen(false);
          }}
        />
      )}
      {selectedClass && (
        <ManageStudentsDialog
          isOpen={isManageStudentsDialogOpen}
          setIsOpen={setIsManageStudentsDialogOpen}
          classData={selectedClass}
          allStudents={allStudents}
          onUpdate={async (classId, studentIds) => {
            await handleUpdatePartial(classId, { studentIds });
            toast({
              title: 'Étudiants mis à jour',
              description: `La liste des étudiants pour la classe ${selectedClass.name} a été mise à jour.`,
            });
            setIsManageStudentsDialogOpen(false);
          }}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedClass?.name}
        itemType="la classe"
      />
    </>
  );
}
