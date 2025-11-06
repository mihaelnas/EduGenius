'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { adminNavLinks, teacherNavLinks, studentNavLinks, type NavLink } from '@/lib/nav-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Mock hook to get user role. In a real app, this would come from auth context.
const useUserRole = () => {
  const [role, setRole] = React.useState('student'); // Default to student

  React.useEffect(() => {
    // In a real app, you would get the role from an auth provider.
    // For this demo, we'll get it from localStorage.
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole && ['admin', 'teacher', 'student'].includes(storedRole)) {
        setRole(storedRole);
      }
    }
  }, []);


  const handleRoleChange = (newRole: string) => {
    if (typeof window !== 'undefined') {
        let email = 'user@etudiant.com';
        if (newRole === 'admin') email = 'user@admin.com';
        if (newRole === 'teacher') email = 'user@enseignant.com';
        localStorage.setItem('userRole', newRole);
        localStorage.setItem('userEmail', email);
    }
    setRole(newRole);
    // You might want to force a reload or navigate to the new role's dashboard home
    window.location.href = '/dashboard';
  };

  return { role, handleRoleChange };
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const { role, handleRoleChange } = useUserRole();

  let navLinks: NavLink[] = [];
  switch (role) {
    case 'admin':
      navLinks = adminNavLinks;
      break;
    case 'teacher':
      navLinks = teacherNavLinks;
      break;

    case 'student':
      navLinks = studentNavLinks;
      break;
  }

  return (
    <>
      <SidebarHeader>
        <div className="p-2">
          <Logo />
        </div>
         {/* This role switcher is for demonstration purposes only */}
        <div className="p-2 group-data-[collapsible=icon]:hidden">
           <label className="text-xs text-sidebar-foreground/70 mb-1 block">Démo : Changer de rôle</label>
           <Select onValueChange={handleRoleChange} value={role}>
            <SelectTrigger className="bg-sidebar-accent border-sidebar-border h-9">
              <SelectValue placeholder="Changer de rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Enseignant</SelectItem>
              <SelectItem value="student">Étudiant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={{ children: link.label }}
              >
                <a href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
