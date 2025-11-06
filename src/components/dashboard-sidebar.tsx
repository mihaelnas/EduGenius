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
  const [role, setRole] = React.useState('admin');

  // In a real app, you wouldn't have this client-side state for the role.
  // This is just for demonstration purposes to allow switching between dashboards.
  const handleRoleChange = (newRole: string) => {
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
           <label className="text-xs text-sidebar-foreground/70 mb-1 block">Demo Role Switcher</label>
           <Select onValueChange={handleRoleChange} defaultValue={role}>
            <SelectTrigger className="bg-sidebar-accent border-sidebar-border h-9">
              <SelectValue placeholder="Switch Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
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
