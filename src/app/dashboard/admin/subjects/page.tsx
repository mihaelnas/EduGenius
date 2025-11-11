
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Subject, Class } from '@/lib/placeholder-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import Image from 'next/image';
import { AddSubjectDialog } from '@/components/admin/add-subject-dialog';
import { EditSubjectDialog } from '@/components/admin/edit-subject-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { AssignSubjectTeacherDialog } from '@/components/admin/assign-subject-teacher-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { secureCreateDocument } from '@/ai/flows/admin-actions';

export default function AdminSubjectsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const subjectsCollectionRef = useMemoFirebase(() => collection(firestore, 'subjects'), [firestore]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsCollectionRef);
  
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersCollectionRef);

  const classesCollectionRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesCollectionRef);
  
  const allTeachers = React.useMemo(() => (users || []).filter(u => u.role === 'teacher'), [users]);

  const handleAdd = async (newSubject: Omit<Subject, 'id' | 'classCount' | 'createdAt'>) => {
      if (!currentUser) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Vous devez être connecté pour créer une matière.' });
        return;
      }
      const newSubjectData = {
          ...newSubject,
          teacherId: '', // Initialize with no teacher
          classCount: 0, // This will be calculated dynamically
      };
      
      try {
          const result = await secureCreateDocument({
              collection: 'subjects',
              userId: currentUser.uid,
              data: newSubjectData,
          });

          if (result.success) {
            toast({
                title: 'Matière ajoutée',
                description: `La matière ${newSubject.name} a été créée avec succès.`,
            });
          } else {
              throw new Error(result.error || "La création de la matière a échoué.");
          }
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Échec de la création',
              description: error.message
          });
      }
  };

  const handleUpdate = async (updatedSubject: Subject) => {
    const subjectDocRef = doc(firestore, 'subjects', updatedSubject.id);
    const { id, ...subjectData } = updatedSubject;
    await updateDoc(subjectDocRef, subjectData);
    toast({
      title: 'Matière modifiée',
      description: `La matière ${updatedSubject.name} a été mise à jour.`,
    });
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
  
  const handleAssignTeacherSave = async (subjectId: string, teacherId: string | undefined) => {
    if (!selectedSubject) return;
    const subjectDocRef = doc(firestore, 'subjects', subjectId);
    await updateDoc(subjectDocRef, { teacherId });
    toast({
      title: 'Assignation réussie',
      description: `L'enseignant a été mis à jour pour la matière ${selectedSubject.name}.`,
    });
    setIsAssignTeacherDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (selectedSubject) {
        const batch = writeBatch(firestore);

        // 1. Find and delete related courses
        const coursesRef = collection(firestore, 'courses');
        const coursesQuery = query(coursesRef, where('subjectId', '==', selectedSubject.id));
        const coursesSnapshot = await getDocs(coursesQuery);
        coursesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Find and delete related schedule events
        const scheduleRef = collection(firestore, 'schedule');
        const scheduleQuery = query(scheduleRef, where('subject', '==', selectedSubject.name));
        const scheduleSnapshot = await getDocs(scheduleQuery);
        scheduleSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 3. Delete the subject itself
        const subjectDocRef = doc(firestore, 'subjects', selectedSubject.id);
        batch.delete(subjectDocRef);

        await batch.commit();

        toast({
            variant: 'destructive',
            title: 'Matière et données associées supprimées',
            description: `La matière "${selectedSubject.name}" ainsi que ses cours et événements ont été supprimés.`,
        });

        setIsDeleteDialogOpen(false);
        setSelectedSubject(null);
    }
  };

  const getTeacherById = (id: string): AppUser | undefined => users?.find(u => u.id === id);

  const filteredSubjects = React.useMemo(() => (subjects || []).map(subject => {
      const assignedClassesCount = (classes || []).filter(c => 
          c.teacherIds.some(tId => tId === subject.teacherId)
      ).length;
      return { ...subject, classCount: assignedClassesCount };
  }).filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [subjects, classes, searchTerm]);

  const isLoading = isLoadingSubjects || isLoadingUsers || isLoadingClasses;

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
                <TableHead>Classes</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredSubjects.map((subject) => {
                  const teacher = subject.teacherId ? getTeacherById(subject.teacherId) : undefined;
                  return (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {subject.photo ? (
                            <Image src={subject.photo} alt={subject.name} width={40} height={40} className="rounded-sm object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center text-muted-foreground text-xs">IMG</div>
                        )}
                        <span>{subject.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{subject.credit}</TableCell>
                    <TableCell>{subject.semestre}</TableCell>
                    <TableCell>{teacher ? getDisplayName(teacher) : 'Non assigné'}</TableCell>
                    <TableCell>{subject.classCount}</TableCell>
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
          onSubjectUpdated={async (updatedData) => {
            await handleUpdate({...selectedSubject, ...updatedData})
          }}
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
        itemName={selectedSubject?.name}
        itemType="la matière"
      />
    </>
  );
}

    