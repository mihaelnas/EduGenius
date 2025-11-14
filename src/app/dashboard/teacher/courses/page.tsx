
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
import { BookOpen, PlusCircle, Paperclip, Video, Link as LinkIcon, Edit, Trash2, Eye } from 'lucide-react';
import { AddCourseDialog, AddCourseFormValues } from '@/components/teacher/add-course-dialog';
import { EditCourseDialog } from '@/components/teacher/edit-course-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const ResourceIcon = ({ type }: { type: Resource['type_resource'] }) => {
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
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(true);

  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = React.useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);

  const fetchCourses = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingCourses(true);
    try {
      // Suppose que cette route renvoie tous les cours de l'enseignant
      const allCourses: Course[] = await apiFetch(`/cours/${user.id}`);
      // On filtre côté client
      setCourses(allCourses.filter(c => c.id_matiere === subject.id_matiere));
    } catch (error: any) {
        if (error.message.includes('404')) {
            setCourses([]);
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les cours pour cette matière." });
        }
    } finally {
      setIsLoadingCourses(false);
    }
  }, [subject.id_matiere, user, toast]);

  React.useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);


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
      try {
        await apiFetch(`/cours/${selectedCourse.id_cours}`, { method: 'DELETE' });
        toast({
          variant: 'destructive',
          title: 'Cours supprimé',
          description: `Le cours "${selectedCourse.titre}" a été supprimé.`,
        });
        fetchCourses();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      }
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    }
  };

  const handleAddCourse = async (values: AddCourseFormValues) => {
    if (!user) return;
    try {
      const payload = { ...values, id_matiere: subject.id_matiere, id_enseignant: user.id };
      await apiFetch('/cours/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast({
        title: 'Cours ajouté',
        description: `Le cours "${values.titre}" a été créé avec succès.`,
      });
      fetchCourses();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };


  const handleUpdateCourse = async (updatedCourseData: AddCourseFormValues) => {
    if (!selectedCourse) return;
    try {
      const payload = {
        ...updatedCourseData,
        id_matiere: selectedCourse.id_matiere,
        id_enseignant: selectedCourse.id_enseignant,
      };
      await apiFetch(`/cours/${selectedCourse.id_cours}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast({
        title: 'Cours modifié',
        description: `Le cours "${updatedCourseData.titre}" a été mis à jour.`,
      });
      fetchCourses();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  return (
    <>
      <CardContent className="p-6 pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-muted-foreground">
              {isLoadingCourses ? <Skeleton className="h-4 w-20"/> : `${courses.length} cours publiés.`}
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un cours
          </Button>
        </div>
        <div className="space-y-4">
          {isLoadingCourses ? (
            <Skeleton className="h-24 w-full" />
          ) : courses.map(course => (
            <div key={course.id_cours} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <Link href={`/dashboard/teacher/courses/${course.id_cours}`} className="font-semibold text-base hover:underline">{course.titre}</Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.contenu}</p>
                </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/teacher/courses/${course.id_cours}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Voir</span>
                        </Link>
                    </Button>
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

              {/* {course.resources && course.resources.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ressources</h4>
                  {course.resources.map((resource, index) => (
                    <a
                      key={resource.id_resource || index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <ResourceIcon type={resource.type_resource} />
                      <span>{resource.titre}</span>
                    </a>
                  ))}
                </div>
              )} */}
            </div>
          ))}
          {!isLoadingCourses && courses.length === 0 && (
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
        subjectName={subject.nom_matiere}
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
        itemName={selectedCourse?.titre}
        itemType="le cours"
      />
    </>
  );
}

export default function TeacherCoursesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [teacherSubjects, setTeacherSubjects] = React.useState<Subject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!user) return;
    const fetchTeacherSubjects = async () => {
        setIsLoading(true);
        try {
            // Suppose une route /enseignant/matieres qui renvoie les matières de l'enseignant loggé
            const data = await apiFetch('/enseignant/matieres'); 
            setTeacherSubjects(data || []);
        } catch (error: any) {
             if (error.message.includes('404')) {
                setTeacherSubjects([]);
             } else {
                toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger vos matières." });
             }
        } finally {
            setIsLoading(false);
        }
    };
    fetchTeacherSubjects();
  }, [user, toast]);
  
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
              <AccordionItem key={subject.id_matiere} value={`subject-${subject.id_matiere}`} className="border-b-0">
                <Card>
                  <CardHeader className="p-0">
                    <AccordionTrigger className="flex w-full items-center justify-between p-6 text-lg font-semibold hover:no-underline">
                      {subject.nom_matiere}
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
