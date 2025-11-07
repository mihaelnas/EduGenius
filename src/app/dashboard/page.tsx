
'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import type { AppUser, Class, Subject, ScheduleEvent, Course } from '@/lib/placeholder-data';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = React.useState<AppUser | null>(null);
  const [isRoleLoading, setIsRoleLoading] = React.useState(true);
  
  const userRole = userProfile?.role;

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as AppUser);
        } else {
          // Fallback or error handling
          setUserProfile({ role: 'student' } as AppUser);
        }
        setIsRoleLoading(false);
      });
    } else if (!isUserLoading) {
        setIsRoleLoading(false);
    }
  }, [user, firestore, isUserLoading]);
  
  // Queries for Admin
  const adminUsersQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'users') : null
  , [firestore, userRole, isRoleLoading]);

  const adminClassesQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'classes') : null
  , [firestore, userRole, isRoleLoading]);

  const adminSubjectsQuery = useMemoFirebase(() => 
    !isRoleLoading && userRole === 'admin' ? collection(firestore, 'subjects') : null
  , [firestore, userRole, isRoleLoading]);

  const { data: adminUsers, isLoading: usersLoading } = useCollection<AppUser>(adminUsersQuery);
  const { data: adminClasses, isLoading: classesLoading } = useCollection<Class>(adminClassesQuery);
  const { data: adminSubjects, isLoading: subjectsLoading } = useCollection<Subject>(adminSubjectsQuery);

  // Queries for Teacher
  const teacherClassesQuery = useMemoFirebase(() =>
    user && !isRoleLoading && userRole === 'teacher' 
    ? query(collection(firestore, 'classes'), where('teacherIds', 'array-contains', user.uid))
    : null
  , [firestore, user, userRole, isRoleLoading]);

  const teacherSubjectsQuery = useMemoFirebase(() =>
    user && !isRoleLoading && userRole === 'teacher'
    ? query(collection(firestore, 'subjects'), where('teacherId', '==', user.uid))
    : null
  , [firestore, user, userRole, isRoleLoading]);
  
  const teacherScheduleQuery = useMemoFirebase(() =>
    user && !isRoleLoading && userRole === 'teacher'
    ? query(collection(firestore, 'schedule'), where('teacherId', '==', user.uid))
    : null
  , [firestore, user, userRole, isRoleLoading]);

  const { data: teacherClasses, isLoading: teacherClassesLoading } = useCollection<Class>(teacherClassesQuery);
  const { data: teacherSubjects, isLoading: teacherSubjectsLoading } = useCollection<Subject>(teacherSubjectsQuery);
  const { data: teacherSchedule, isLoading: teacherScheduleLoading } = useCollection<ScheduleEvent>(teacherScheduleQuery);
  
  // --- Queries for Student ---
    const studentClassQuery = useMemoFirebase(() =>
        user && !isRoleLoading && userRole === 'student'
        ? query(collection(firestore, 'classes'), where('studentIds', 'array-contains', user.uid), limit(1))
        : null
    , [firestore, user, userRole, isRoleLoading]);

    const { data: studentClasses, isLoading: studentClassLoading } = useCollection<Class>(studentClassQuery);
    const studentClass = studentClasses?.[0];

    const [studentSubjects, setStudentSubjects] = React.useState<Subject[]>([]);
    const [recentCourses, setRecentCourses] = React.useState<Course[]>([]);
    const [isStudentDataLoading, setIsStudentDataLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchStudentData() {
            if (userRole !== 'student' || studentClassLoading) {
                return;
            }
            if (!studentClass) {
                setIsStudentDataLoading(false);
                return;
            }
            
            setIsStudentDataLoading(true);

            // 1. Find all teachers for the student's class
            const teacherIds = studentClass.teacherIds;
            if (!teacherIds || teacherIds.length === 0) {
              setStudentSubjects([]);
              setRecentCourses([]);
              setIsStudentDataLoading(false);
              return;
            }

            // 2. Find all subjects taught by those teachers
            const subjectsQuery = query(collection(firestore, 'subjects'), where('teacherId', 'in', teacherIds));
            const subjectsSnapshot = await getDocs(subjectsQuery);
            const subjects: Subject[] = subjectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subject));
            setStudentSubjects(subjects);

            // 3. Find recent courses in those subjects
            if (subjects.length > 0) {
                const subjectIds = subjects.map(s => s.id);
                // Query courses across all relevant subjects
                const coursesQuery = query(
                    collection(firestore, 'courses'),
                    where('subjectId', 'in', subjectIds),
                    orderBy('createdAt', 'desc'),
                    limit(3) // Get the 3 most recent courses overall
                );
                
                const coursesSnapshot = await getDocs(coursesQuery);
                const allRecentCourses = coursesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, id: doc.id } as Course;
                });
                
                setRecentCourses(allRecentCourses);
            } else {
                setRecentCourses([]);
            }

            setIsStudentDataLoading(false);
        }

        fetchStudentData();

    }, [studentClass, firestore, userRole, studentClassLoading]);

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
        return <AdminDashboard userName={userProfile?.firstName} users={adminUsers || []} classes={adminClasses || []} subjects={adminSubjects || []} />;
      case 'teacher':
        if (teacherClassesLoading || teacherSubjectsLoading || teacherScheduleLoading) {
             return (
                <>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                    <div className="grid gap-4 mt-4">
                        <Skeleton className="h-64" />
                    </div>
                </>
            );
        }
        return <TeacherDashboard 
            userName={userProfile?.firstName} 
            classes={teacherClasses || []}
            subjects={teacherSubjects || []}
            schedule={teacherSchedule || []}
        />;
      case 'student':
         if (studentClassLoading || isStudentDataLoading) {
            return (
                <>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-40" />
                        <Skeleton className="h-40" />
                    </div>
                    <div className="grid gap-4 mt-4">
                        <Skeleton className="h-64" />
                    </div>
                </>
            );
         }
        return <StudentDashboard 
            userName={userProfile?.firstName}
            studentClass={studentClass}
            subjects={studentSubjects}
            recentCourses={recentCourses}
        />;
      default:
        return <div>Rôle utilisateur non reconnu.</div>;
    }
  };

  return <>{renderDashboard()}</>;
}

    