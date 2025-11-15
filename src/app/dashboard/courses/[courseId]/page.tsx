
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Course,
  Resource,
} from '@/lib/placeholder-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Paperclip, Video, Link as LinkIcon, ChevronRight, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

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
    const router = useRouter();

    useEffect(() => {
        if (!user || !courseId) return;
        
        setIsLoading(true);
        const fetchCourseData = async () => {
            try {
                let courseData: Course;
                if (user.role === 'etudiant') {
                    courseData = await apiFetch(`/etudiant/${user.id}/cours/${courseId}`);
                } else { // enseignant ou admin
                    courseData = await apiFetch(`/cours/${courseId}`);
                    // Validation côté client pour plus de sécurité
                    if (user.role === 'enseignant' && courseData.id_enseignant !== user.id) {
                        throw new Error("Vous n'êtes pas autorisé à voir ce cours.");
                    }
                }

                // Charger les ressources séparément
                const resourcesData = await apiFetch(`/cours/${courseId}/ressources`);
                courseData.resources = resourcesData || [];
                setCourse(courseData);

            } catch (err: any) {
                setError(err.message || `Le cours avec l'ID ${courseId} n'a pas été trouvé.`);
                toast({ variant: 'destructive', title: 'Erreur', description: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseData();
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
        const breadcrumbBase = user?.role === 'enseignant'
            ? { href: '/dashboard/teacher/courses', label: 'Mes Cours' }
            : { href: '/dashboard/student/courses', label: 'Mes Cours' };
        
        return (
             <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-destructive">Erreur</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                 <Button asChild variant="outline" size="sm" className="mt-6">
                    <Link href={breadcrumbBase.href}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à mes cours
                    </Link>
                </Button>
            </div>
        )
    }
    
    const breadcrumbBase = user?.role === 'enseignant'
    ? { href: '/dashboard/teacher/courses', label: 'Mes Cours' }
    : { href: '/dashboard/student/courses', label: 'Mes Cours' };

    return (
        <div>
            <div className="mb-6">
                <Button asChild variant="outline" size="sm">
                <Link href={breadcrumbBase.href}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste
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

                {course.resources && course.resources.length > 0 && (
                    <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4 font-headline">Ressources du cours</h3>
                    <div className="space-y-3">
                        {course.resources.map((resource) => (
                        <a
                            key={resource.id_ressource}
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
                )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  if (!courseId) {
      notFound();
      return null;
  }
  
  return <CourseDetailContent courseId={courseId} />;
}
