'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Course, Resource } from '@/lib/placeholder-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Paperclip, Video, Link as LinkIcon, ChevronRight, ArrowLeft } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function CourseDetailContent({ courseId }: { courseId: string }) {
  const firestore = useFirestore();

  const courseDocRef = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return doc(firestore, 'courses', courseId);
  }, [firestore, courseId]);

  const { data: course, isLoading: isLoadingCourse } = useDoc<Course>(courseDocRef);

  if (isLoadingCourse) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!course) {
    return notFound();
  }

  // Debugging: only display course content
  return (
    <div>
      <h1>Voici le cours :</h1>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          background: '#1a1a1a',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        {course.content}
      </pre>
    </div>
  );
}

export default function TeacherCourseDetailPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
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

  return <CourseDetailContent courseId={courseId} />;
}
