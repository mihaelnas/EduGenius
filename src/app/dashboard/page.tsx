
'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import type { AppUser, Class, Subject, Course } from '@/lib/placeholder-data';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';


export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card><CardHeader><Skeleton className="h-4 w-2/3"/></CardHeader><CardContent><Skeleton className="h-10 w-1/3"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-2/3"/></CardHeader><CardContent><Skeleton className="h-10 w-1/3"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-2/3"/></CardHeader><CardContent><Skeleton className="h-10 w-1/3"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-2/3"/></CardHeader><CardContent><Skeleton className="h-10 w-1/3"/></CardContent></Card>
            </div>
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/3"/></CardHeader>
                <CardContent><Skeleton className="h-32 w-full"/></CardContent>
            </Card>
        </div>
    );
  }

  const renderDashboard = () => {
    // Les données ici sont statiques pour l'instant.
    // Vous devrez les remplacer par des appels à votre API FastAPI.
    switch (user.role) {
      case 'admin':
        return <AdminDashboard userName={user.firstName} users={[]} classes={[]} subjects={[]} />;
      case 'teacher':
        return <TeacherDashboard 
            userName={user.firstName} 
            classes={[]}
            subjects={[]}
            schedule={[]}
        />;
      case 'student':
        return <StudentDashboard 
            userName={user.firstName}
            studentClass={null}
            subjects={[]}
            recentCourses={[]}
            getSubjectName={() => 'Matière Inconnue'}
        />;
      default:
        // Redirige au cas où le rôle serait invalide
        logout();
        return null;
    }
  };

  return <>{renderDashboard()}</>;
}
