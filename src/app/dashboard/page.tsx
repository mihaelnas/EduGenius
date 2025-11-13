
'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import type { AppUser, Class, Subject } from '@/lib/placeholder-data';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [adminData, setAdminData] = React.useState<{users: AppUser[], classes: Class[], subjects: Subject[]} | null>(null);
  const [isDataLoading, setIsDataLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
    
    if (user?.role === 'admin') {
      const fetchAdminData = async () => {
        setIsDataLoading(true);
        try {
          const [students, teachers, classes, subjects] = await Promise.all([
            apiFetch('/admin/etudiants'),
            apiFetch('/admin/professeurs'),
            apiFetch('/admin/classes'),
            apiFetch('/admin/matieres'),
          ]);
          setAdminData({
            users: [...(students || []), ...(teachers || [])],
            classes: classes || [],
            subjects: subjects || [],
          });
        } catch (error) {
          console.error("Failed to fetch admin dashboard data", error);
          // Gérer l'erreur, peut-être avec un toast
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchAdminData();
    } else {
        // Pour les autres rôles, nous n'avons pas besoin de charger des données supplémentaires ici pour l'instant
        setIsDataLoading(false);
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
                    users={adminData?.users || []} 
                    classes={adminData?.classes || []} 
                    subjects={adminData?.subjects || []} 
                />;
      case 'enseignant':
        // Pour l'instant, les données sont statiques. Il faudra les charger comme pour l'admin.
        return <TeacherDashboard 
            userName={user.prenom} 
            classes={[]}
            subjects={[]}
            schedule={[]}
        />;
      case 'etudiant':
         // Pour l'instant, les données sont statiques.
        return <StudentDashboard 
            userName={user.prenom}
            studentClass={null}
            subjects={[]}
            recentCourses={[]}
            getSubjectName={() => 'Matière Inconnue'}
        />;
      default:
        // Au cas où le rôle serait invalide
        router.push('/login');
        return null;
    }
  };

  return <>{renderDashboard()}</>;
}
