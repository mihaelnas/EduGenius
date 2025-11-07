'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { users as initialUsers, classes as initialClasses, subjects as initialSubjects, AppUser, Class, Subject } from '@/lib/placeholder-data';


const useUser = () => {
  const [user, setUser] = React.useState<{ name: string | null, role: string | null }>({ name: null, role: null });

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    setUser({ name, role });
  }, []);

  return user;
};

export default function DashboardPage() {
  const { name, role } = useUser();
  
  // These states are now managed here to make dashboards dynamic
  const [users, setUsers] = React.useState<AppUser[]>(initialUsers);
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);
  const [subjects, setSubjects] = React.useState<Subject[]>(initialSubjects);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard userName={name} users={users} classes={classes} subjects={subjects} />;
      case 'teacher':
        return <TeacherDashboard userName={name} />;
      case 'student':
        return <StudentDashboard userName={name} />;
      default:
        // Skeleton loader while role is being determined
        return (
          <>
            <Skeleton className="h-8 w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-80 xl:col-span-2" />
                <Skeleton className="h-80" />
            </div>
          </>
        );
    }
  };

  return <>{renderDashboard()}</>;
}
