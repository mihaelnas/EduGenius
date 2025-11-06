import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, School, Book, Calendar, User, BookOpen } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/classes', label: 'Classes', icon: School },
  { href: '/dashboard/admin/subjects', label: 'Subjects', icon: Book },
];

export const teacherNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/teacher/classes', label: 'My Classes', icon: School },
  { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: Calendar },
];

export const studentNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/student/classmates', label: 'Classmates', icon: Users },
];
