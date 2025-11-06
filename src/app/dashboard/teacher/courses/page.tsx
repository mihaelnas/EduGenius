
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { subjects, courses as allCourses, Course, Resource } from '@/lib/placeholder-data';
import { BookOpen, PlusCircle, Paperclip, Video, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { AddCourseDialog } from '@/components/teacher/add-course-dialog';
import { EditCourseDialog } from '@/components/teacher/edit-course-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';

// Mock: assumes the logged in teacher is Alice Johnson (id: usr_2)
const TEACHER_ID = 'usr_2';

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

export default function TeacherCoursesPage() {
  const teacherSubjects = subjects.filter(s => s.teacherId === TEACHER_ID);
  const [courses, setCourses] = React.useState<Course[]>(allCourses);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = React.useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);

  const handleOpenAddDialog = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
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

  const confirmDelete = () => {
    if (selectedCourse) {
      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    }
  };

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
          {teacherSubjects.map(subject => (
            <AccordionItem key={subject.id} value={`subject-${subject.id}`} className="border-b-0">
              <Card>
                <CardHeader className="p-0">
                  <AccordionTrigger className="flex w-full items-center justify-between p-6 text-lg font-semibold hover:no-underline">
                    {subject.name}
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="p-6 pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-muted-foreground">
                         {courses.filter(c => c.subjectId === subject.id).length} cours publiés.
                      </p>
                       <Button variant="outline" size="sm" onClick={() => handleOpenAddDialog(subject.id)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un cours
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {courses.filter(c => c.subjectId === subject.id).map(course => (
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

                          {course.resources.length > 0 && (
                            <div className="mt-3 space-y-2 border-t pt-3">
                               <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ressources</h4>
                              {course.resources.map(resource => (
                                <a
                                  key={resource.id}
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
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

       {selectedSubjectId && (
        <AddCourseDialog
          isOpen={isAddCourseDialogOpen}
          setIsOpen={setIsAddCourseDialogOpen}
          subjectId={selectedSubjectId}
          onCourseAdded={(newCourse) => setCourses(prev => [...prev, newCourse])}
        />
      )}

      {selectedCourse && (
        <EditCourseDialog
          isOpen={isEditCourseDialogOpen}
          setIsOpen={setIsEditCourseDialogOpen}
          course={selectedCourse}
          onCourseUpdated={(updatedCourse) => setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c))}
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
