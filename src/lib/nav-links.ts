import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, School, Book, Calendar, User, BookOpen } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/admin/classes', label: 'Classes', icon: School },
  { href: '/dashboard/admin/subjects', label: 'Matières', icon: Book },
];

export const teacherNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/teacher/classes', label: 'Mes Classes', icon: School },
  { href: '/dashboard/teacher/courses', label: 'Mes Cours', icon: BookOpen },
  { href: '/dashboard/teacher/schedule', label: 'Emploi du temps', icon: Calendar },
];

export const studentNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/student/courses', label: 'Mes Cours', icon: BookOpen },
  { href: '/dashboard/student/classmates', label: 'Camarades', icon: Users },
];
