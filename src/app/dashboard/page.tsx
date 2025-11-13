
'use client';

import React from 'react';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import type { AppUser, Class, Subject, Course } from '@/lib/placeholder-data';


export default function DashboardPage() {
  
  // Since Firebase is removed, we'll display a placeholder.
  // In a real app, you would fetch user data from your new backend (e.g., FastAPI)
  // and determine which dashboard to show based on the user's role.
  
  const userRole = 'admin'; // Hardcoded for demonstration purposes. Change to 'teacher' or 'student' to see other dashboards.
  const userName = "Admin"; // Hardcoded username

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        // Dummy data for demonstration
        return <AdminDashboard userName={userName} users={[]} classes={[]} subjects={[]} />;
      case 'teacher':
        return <TeacherDashboard 
            userName={"Teacher"} 
            classes={[]}
            subjects={[]}
            schedule={[]}
        />;
      case 'student':
        return <StudentDashboard 
            userName={"Student"}
            studentClass={null}
            subjects={[]}
            recentCourses={[]}
            getSubjectName={() => 'Matière Inconnue'}
        />;
      default:
        return <div>Rôle utilisateur non reconnu.</div>;
    }
  };

  return <>{renderDashboard()}</>;
}
