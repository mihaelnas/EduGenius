
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
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [isDataLoading, setIsDataLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
        const fetchDashboardData = async () => {
            setIsDataLoading(true);
            try {
                if (user.role === 'admin') {
                    const [students, teachers, classes, subjects] = await Promise.all([
                        apiFetch('/admin/etudiants'),
                        apiFetch('/admin/professeurs'),
                        apiFetch('/admin/classes'),
                        apiFetch('/admin/matieres'),
                    ]);
                    setDashboardData({
                        users: [...(students || []), ...(teachers || [])],
                        classes: classes || [],
                        subjects: subjects || [],
                    });
                } else if (user.role === 'enseignant') {
                    const [classes, subjects, schedule] = await Promise.all([
                        apiFetch(`/enseignant/${user.id}/classes`).catch(() => []),
                        apiFetch(`/enseignant/${user.id}/matieres`).catch(() => []),
                        Promise.resolve([]), // La route pour le planning n'est pas encore prête
                    ]);
                    setDashboardData({ classes, subjects, schedule });
                } else if (user.role === 'etudiant') {
                     const [studentClass, subjects, courses] = await Promise.all([
                        apiFetch(`/etudiant/${user.id}/classe`).catch(() => null),
                        apiFetch(`/etudiant/${user.id}/matieres`).catch(() => []),
                        apiFetch(`/etudiant/${user.id}/cours`).catch(() => []),
                    ]);
                    setDashboardData({ studentClass, subjects, courses });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchDashboardData();
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || isDataLoading || !user) {
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
    switch (user.role) {
      case 'admin':
        return <AdminDashboard 
                    userName={user.prenom} 
                    users={dashboardData?.users || []} 
                    classes={dashboardData?.classes || []} 
                    subjects={dashboardData?.subjects || []} 
                />;
      case 'enseignant':
        return <TeacherDashboard 
            userName={user.prenom} 
            classes={dashboardData?.classes || []}
            subjects={dashboardData?.subjects || []}
            schedule={dashboardData?.schedule || []}
        />;
      case 'etudiant':
        const getSubjectName = (subjectId: number) => {
            const subject = dashboardData?.subjects.find((s: Subject) => s.id_matiere === subjectId);
            return subject?.nom_matiere || 'Matière Inconnue';
        };
        return <StudentDashboard 
            userName={user.prenom}
            studentClass={dashboardData?.studentClass}
            subjects={dashboardData?.subjects || []}
            recentCourses={(dashboardData?.courses || []).slice(0, 3)}
            getSubjectName={getSubjectName}
        />;
      default:
        router.push('/login');
        return null;
    }
  };

  return <>{renderDashboard()}</>;
}
