
'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Course, Resource } from '@/lib/placeholder-data';
import { ArrowLeft, ChevronRight, Link as LinkIcon, Paperclip, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

const ResourceIcon = ({ type }: { type: Resource['type_resource'] }) => {
  switch (type) {
    case 'pdf':
      return <Paperclip className="h-5 w-5 text-primary" />;
    case 'video':
      return <Video className="h-5 w-5 text-primary" />;
    case 'link':
      return <LinkIcon className="h-5 w-5 text-primary" />;
    default:
      return null;
  }
};


function CourseDetailContent({ courseId }: { courseId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const fetchCourse = async () => {
            try {
                const data: Course = await apiFetch(`/cours/${courseId}`);
                // Double-check ownership on client-side as a fallback
                if (data.id_enseignant !== user.id) {
                    throw new Error("Vous n'êtes pas autorisé à voir ce cours.");
                }
                setCourse(data);
            } catch (err: any) {
                setError(err.message || "Le cours demandé n'a pas été trouvé.");
                toast({ variant: "destructive", title: "Erreur", description: err.message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, user, toast]);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-9 w-40 mb-6" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-4 w-1/4 mb-2" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (error || !course) {
        return (
             <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-destructive">Erreur</h2>
                <p className="text-muted-foreground mt-2">{error || "Cours introuvable."}</p>
                 <Button asChild variant="outline" size="sm" className="mt-6">
                    <Link href="/dashboard/teacher/courses">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à mes cours
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/teacher/courses">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à mes cours
                </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                <p className="text-sm font-semibold text-primary">{course.matiere?.nom_matiere || 'Matière'}</p>
                <CardTitle className="text-3xl font-headline">{course.titre}</CardTitle>
                <CardDescription>Publié le {new Date(course.cree_a).toLocaleDateString('fr-FR')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                        <p>{course.contenu}</p>
                    </div>
                     {/* {course.resources && course.resources.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-4 font-headline">Ressources du cours</h3>
                            <div className="space-y-3">
                                {course.resources.map((resource, index) => (
                                <a
                                    key={resource.id_resource || index}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <ResourceIcon type={resource.type_resource} />
                                        <span className="font-medium">{resource.titre}</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </a>
                                ))}
                            </div>
                        </div>
                     )} */}
                </CardContent>
            </Card>
        </div>
    );
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  if (!courseId) {
    notFound();
    return null;
  }

  return <CourseDetailContent courseId={courseId} />;
}
