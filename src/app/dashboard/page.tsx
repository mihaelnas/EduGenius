'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import type { AppUser, Class, Subject } from '@/lib/placeholder-data';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        } else {
          // Handle case where user doc might not be created yet
          setUserRole('student'); // Default or error handling
        }
        setIsRoleLoading(false);
      });
    } else if (!isUserLoading) {
        setIsRoleLoading(false); // No user, so role loading is done
    }
  }, [user, firestore, isUserLoading]);
  
  const usersQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'users') : null
  , [firestore, userRole, isRoleLoading]);

  const classesQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'classes') : null
  , [firestore, userRole, isRoleLoading]);

  const subjectsQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'subjects') : null
  , [firestore, userRole, isRoleLoading]);

  const { data: users, isLoading: usersLoading } = useCollection<AppUser>(usersQuery);
  const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);
  const { data: subjects, isLoading: subjectsLoading } = useCollection<Subject>(subjectsQuery);


  const renderDashboard = () => {
    if (isUserLoading || isRoleLoading) {
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

    switch (userRole) {
      case 'admin':
        // Admin dashboard also needs loading state for its specific data
        if (usersLoading || classesLoading || subjectsLoading) {
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
        return <AdminDashboard userName={user?.displayName || user?.email} users={users || []} classes={classes || []} subjects={subjects || []} />;
      case 'teacher':
        return <TeacherDashboard userName={user?.displayName || user?.email} />;
      case 'student':
        return <StudentDashboard userName={user?.displayName || user?.email} />;
      default:
        // This can be shown if the user is logged in but has no role or doc for some reason
        return <StudentDashboard userName={user?.displayName || user?.email} />;
    }
  };

  return <>{renderDashboard()}</>;
}
