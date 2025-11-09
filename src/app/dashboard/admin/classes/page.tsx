
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminClassesPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const classesCollectionRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesCollectionRef);
  
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersCollectionRef);

  const allTeachers = React.useMemo(() => (users || []).filter(u => u.role === 'teacher'), [users]);
  const allStudents = React.useMemo(() => (users || []).filter(u => u.role === 'student'), [users]);

  const handleAdd = async (newClass: Omit<Class, 'id' | 'teacherIds' | 'studentIds' | 'createdAt'>) => {
    const newClassData = {
        ...newClass,
        teacherIds: [],
        studentIds: [],
        createdAt: new Date().toISOString(),
    };
    await addDoc(classesCollectionRef, newClassData);
    toast({
      title: 'Classe ajoutée',
      description: `La classe ${newClass.name} a été créée avec succès.`,
    });
  };

  const handleUpdate = async (updatedClass: Class) => {
    const classDocRef = doc(firestore, 'classes', updatedClass.id);
    const { id, ...classData } = updatedClass;
    await updateDoc(classDocRef, classData);
    toast({
      title: 'Classe modifiée',
      description: `La classe ${updatedClass.name} a été mise à jour.`,
    });
  };
  
  const handleUpdatePartial = async (classId: string, data: Partial<Omit<Class, 'id'>>) => {
     const classDocRef = doc(firestore, 'classes', classId);
     await updateDoc(classDocRef, data);
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
    if (selectedClass) {
        const batch = writeBatch(firestore);

        // 1. Find and delete related schedule events
        const scheduleRef = collection(firestore, 'schedule');
        const scheduleQuery = query(scheduleRef, where('class', '==', selectedClass.name));
        const scheduleSnapshot = await getDocs(scheduleQuery);
        scheduleSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Delete the class itself
        const classDocRef = doc(firestore, 'classes', selectedClass.id);
        batch.delete(classDocRef);
        
        await batch.commit();

        toast({
            variant: 'destructive',
            title: 'Classe et données associées supprimées',
            description: `La classe "${selectedClass.name}" ainsi que ses événements d'emploi du temps ont été supprimés.`,
        });

        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
    }
  };
  
  const getTeacherById = (id: string): AppUser | undefined => users?.find(u => u.id === id);

  const filteredClasses = React.useMemo(() => (classes || []).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.filiere.toLowerCase().includes(searchTerm.toLowerCase())
  ), [classes, searchTerm]);

  const isLoading = isLoadingClasses || isLoadingUsers;

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
              ) : (filteredClasses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.niveau}</TableCell>
                  <TableCell>{c.filiere}</TableCell>
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
            await handleUpdate({...selectedClass, ...updatedData})
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
