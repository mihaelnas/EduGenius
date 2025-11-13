
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

type WithId<T> = T & { id: string };

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
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
    const [course, setCourse] = useState<WithId<Course> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // TODO: Replace with your actual API call to fetch course data
        setIsLoading(true);
        // Simulating API fetch
        setTimeout(() => {
            // In a real app, you would fetch from `/api/courses/${courseId}`
            // For now, let's simulate not found.
            // setCourse({ id: courseId, title: "Titre du Cours", content: "Contenu...", ...});
            setError("Le cours demandé n'a pas été trouvé (simulation).");
            setIsLoading(false);
        }, 1000);
    }, [courseId]);
    
    // This would come from your auth context
    const userRole = 'student'; 

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
                        <div className="mt-8">
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-destructive">Erreur</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                 <Button asChild variant="outline" size="sm" className="mt-6">
                    <Link href="/dashboard/student/courses">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à mes cours
                    </Link>
                </Button>
            </div>
        )
    }

    if (!course) {
        notFound();
        return null; 
    }
    
    const breadcrumbBase = userRole === 'teacher' 
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
                <p className="text-sm font-semibold text-primary">{course.subjectName}</p>
                <CardTitle className="text-3xl font-headline">{course.title}</CardTitle>
                {course.createdAt && (
                    <CardDescription>Publié le {new Date(course.createdAt).toLocaleDateString('fr-FR')}</CardDescription>
                )}
                </CardHeader>
                <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                    <p>{course.content}</p>
                </div>

                {course.resources && course.resources.length > 0 && (
                    <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4 font-headline">Ressources du cours</h3>
                    <div className="space-y-3">
                        {course.resources.map((resource, index) => (
                        <a
                            key={resource.id || index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <ResourceIcon type={resource.type} />
                                <span className="font-medium">{resource.title}</span>
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
  
  return <CourseDetailContent courseId={courseId} />;
}
