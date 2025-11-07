
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { classes as initialClasses, Class, users, getDisplayName, AppUser } from '@/lib/placeholder-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import { AddClassDialog } from '@/components/admin/add-class-dialog';
import { EditClassDialog } from '@/components/admin/edit-class-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { AssignTeacherDialog } from '@/components/admin/assign-teacher-dialog';
import { ManageStudentsDialog } from '@/components/admin/manage-students-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminClassesPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const { toast } = useToast();

  const allTeachers = users.filter(u => u.role === 'teacher');
  const allStudents = users.filter(u => u.role === 'student');

  const handleAdd = (newClass: Omit<Class, 'id' | 'teacherIds' | 'studentIds' | 'createdAt'>) => {
    const newClassData: Class = {
        ...newClass,
        id: `cls_${Date.now()}`,
        teacherIds: [],
        studentIds: [],
        createdAt: new Date().toISOString().split('T')[0],
    };
    setClasses(prev => [newClassData, ...prev]);
    toast({
      title: 'Classe ajoutée',
      description: `La classe ${newClass.name} a été créée avec succès.`,
    });
  };

  const handleUpdate = (updatedClass: Class) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
     toast({
      title: 'Classe modifiée',
      description: `La classe ${updatedClass.name} a été mise à jour.`,
    });
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

  const confirmDelete = () => {
    if (selectedClass) {
      setClasses(classes.filter(c => c.id !== selectedClass.id));
       toast({
        variant: 'destructive',
        title: 'Classe supprimée',
        description: `La classe ${selectedClass.name} a été supprimée.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
    }
  };
  
  const getTeacherById = (id: string): AppUser | undefined => users.find(u => u.id === id);

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.filiere.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {filteredClasses.map((c) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedClass && (
        <EditClassDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          classData={selectedClass}
          onClassUpdated={(updatedData) => handleUpdate({...selectedClass, ...updatedData})}
        />
      )}
       {selectedClass && (
        <AssignTeacherDialog
          isOpen={isAssignTeacherDialogOpen}
          setIsOpen={setIsAssignTeacherDialogOpen}
          classData={selectedClass}
          allTeachers={allTeachers}
          onAssign={(classId, teacherIds) => {
            setClasses(classes.map(c => c.id === classId ? {...c, teacherIds} : c));
          }}
        />
      )}
      {selectedClass && (
        <ManageStudentsDialog
          isOpen={isManageStudentsDialogOpen}
          setIsOpen={setIsManageStudentsDialogOpen}
          classData={selectedClass}
          allStudents={allStudents}
          onUpdate={(classId, studentIds) => {
             setClasses(classes.map(c => c.id === classId ? {...c, studentIds} : c));
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
