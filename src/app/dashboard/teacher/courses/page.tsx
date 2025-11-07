'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Course, Resource, Subject } from '@/lib/placeholder-data';
import { BookOpen, PlusCircle, Paperclip, Video, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { AddCourseDialog } from '@/components/teacher/add-course-dialog';
import { EditCourseDialog } from '@/components/teacher/edit-course-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Query, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
  switch (type) {
    case 'pdf':
      return <Paperclip className="h-4 w-4 text-muted-foreground" />;
    case 'video':
      return <Video className="h-4 w-4 text-muted-foreground" />;
    case 'link':
      return <LinkIcon className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
};

function SubjectCourses({ subject }: { subject: Subject }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const coursesQuery = useMemoFirebase(() => query(collection(firestore, 'courses'), where('subjectId', '==', subject.id)), [firestore, subject.id]);
  const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery as Query<Course> | null);

  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = React.useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);

  const handleOpenAddDialog = () => {
    setIsAddCourseDialogOpen(true);
  };
  
  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseDialogOpen(true);
  };

  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCourse) {
      const courseDocRef = doc(firestore, 'courses', selectedCourse.id);
      await deleteDoc(courseDocRef);
      toast({
        variant: 'destructive',
        title: 'Cours supprimé',
        description: `Le cours "${selectedCourse.title}" a été supprimé.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    }
  };

  const handleAddCourse = async (newCoursePayload: Omit<Course, 'id' | 'teacherId' | 'createdAt'>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non authentifié.' });
      return;
    }
    
    // Generate a new document reference with a unique ID
    const courseDocRef = doc(collection(firestore, 'courses'));

    const finalPayload: Course = {
        id: courseDocRef.id,
        ...newCoursePayload,
        teacherId: user.uid,
        createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(courseDocRef, finalPayload);
      toast({
        title: 'Cours ajouté',
        description: `Le cours "${finalPayload.title}" a été créé avec succès.`,
      });
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        variant: 'destructive',
        title: 'Échec de l\'ajout du cours',
        description: "La création du cours a échoué. Veuillez réessayer.",
      });
    }
  };


  const handleUpdateCourse = async (updatedCourse: Course) => {
    if (!updatedCourse.id) {
        toast({ variant: "destructive", title: "Erreur", description: "ID de cours manquant." });
        return;
    }
    const courseDocRef = doc(firestore, 'courses', updatedCourse.id);
    await updateDoc(courseDocRef, { ...updatedCourse });
    toast({
      title: 'Cours modifié',
      description: `Le cours "${updatedCourse.title}" a été mis à jour.`,
    });
  };

  return (
    <>
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-muted-foreground">
              {isLoadingCourses ? <Skeleton className="h-4 w-20"/> : `${(courses || []).length} cours publiés.`}
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un cours
          </Button>
        </div>
        <div className="space-y-4">
          {isLoadingCourses ? (
            <Skeleton className="h-24 w-full" />
          ) : (courses || []).map(course => (
            <div key={course.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="font-semibold text-base">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.content}</p>
                </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(course)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(course)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                    </Button>
                </div>
              </div>

              {course.resources && course.resources.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ressources</h4>
                  {course.resources.map((resource, index) => (
                    <a
                      key={resource.id || index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <ResourceIcon type={resource.type} />
                      <span>{resource.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!isLoadingCourses && (courses || []).length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Aucun cours dans cette matière pour le moment.
            </p>
          )}
        </div>
      </CardContent>

      <AddCourseDialog
        isOpen={isAddCourseDialogOpen}
        setIsOpen={setIsAddCourseDialogOpen}
        onCourseAdded={handleAddCourse}
        subjectId={subject.id}
        subjectName={subject.name}
      />

      {selectedCourse && (
        <EditCourseDialog
          isOpen={isEditCourseDialogOpen}
          setIsOpen={setIsEditCourseDialogOpen}
          course={selectedCourse}
          onCourseUpdated={handleUpdateCourse}
        />
      )}
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedCourse?.title}
        itemType="le cours"
      />
    </>
  );
}

export default function TeacherCoursesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const teacherSubjectsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'subjects'), where('teacherId', '==', user.uid)) : null,
    [user, firestore]
  );
  
  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(teacherSubjectsQuery);

  const isLoading = isUserLoading || isLoadingSubjects;
  
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Gestion des Cours</h1>
        <p className="text-muted-foreground">
          Gérez le contenu pédagogique de vos matières.
        </p>
      </div>

      <div className="mt-6">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader></Card>
            ))
          ) : teacherSubjects && teacherSubjects.length > 0 ? (
            teacherSubjects.map(subject => (
              <AccordionItem key={subject.id} value={`subject-${subject.id}`} className="border-b-0">
                <Card>
                  <CardHeader className="p-0">
                    <AccordionTrigger className="flex w-full items-center justify-between p-6 text-lg font-semibold hover:no-underline">
                      {subject.name}
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <SubjectCourses subject={subject} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="text-xl font-semibold mt-4">Aucune matière ne vous est assignée</p>
                <p className="text-muted-foreground mt-2">Veuillez contacter un administrateur pour vous faire assigner à une matière.</p>
            </div>
          )}
        </Accordion>
      </div>
    </>
  );
}
