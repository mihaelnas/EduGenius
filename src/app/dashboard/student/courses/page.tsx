
'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Subject, Course } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchSubjects = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch(`dashboard/etudiant/${user.id}/matieres`);
            setSubjects(data || []);
        } catch (error: any) {
            if (!error.message.includes('404')) {
                toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger vos matières." });
            }
            setSubjects([]);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSubjects();
  }, [user, toast]);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Cours</h1>
      <p className="text-muted-foreground">Accédez ici à tous vos supports de cours et contenus.</p>
      <div className="mt-6">
        <Accordion type="multiple" className="w-full space-y-4">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader></Card>
             ))
          ) : subjects.length > 0 ? (
            subjects.map(subject => (
              <SubjectAccordionItem key={subject.id_matiere} subject={subject} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="text-xl font-semibold mt-4">Aucune matière trouvée</p>
                <p className="text-muted-foreground mt-2">Vous n'êtes inscrit à aucune matière pour le moment.</p>
            </div>
          )}
        </Accordion>
      </div>
    </>
  );
}


function SubjectAccordionItem({ subject }: { subject: Subject }) {
    const { user } = useAuth();
    const [courses, setCourses] = React.useState<Course[] | null>(null);
    const [isLoadingCourses, setIsLoadingCourses] = React.useState(true);
    
     React.useEffect(() => {
        if (!user) return;
        const fetchCourses = async () => {
            setIsLoadingCourses(true);
            try {
                // On récupère tous les cours de l'étudiant et on filtre côté client
                const allCourses: Course[] = await apiFetch(`/etudiant/${user.id}/cours`);
                setCourses(allCourses.filter(c => c.id_matiere === subject.id_matiere));
            } catch (error) {
                setCourses([]);
            } finally {
                setIsLoadingCourses(false);
            }
        };
        fetchCourses();
    }, [user, subject.id_matiere]);
    
    return (
        <AccordionItem value={`item-${subject.id_matiere}`} className="border-b-0 rounded-lg bg-card overflow-hidden">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4">
                {subject.nom_matiere}
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-1 pt-2 border-t">
                {isLoadingCourses ? (
                    <div className="px-4 py-2 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : courses && courses.length > 0 ? (
                    courses.map(course => {
                      const href = `/dashboard/courses/${course.id_cours}`;
                      return (
                        <Link
                          key={course.id_cours}
                          href={href}
                          className="flex items-center justify-between gap-3 p-4 mx-2 rounded-md hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span className="font-medium text-foreground/80">{course.titre}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                      );
                    })
                ) : (
                    <p className="px-6 py-4 text-sm text-muted-foreground">Aucun cours disponible pour cette matière.</p>
                )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
