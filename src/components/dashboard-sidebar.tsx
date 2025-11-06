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

  return role;
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const role = useUserRole();

  let navLinks: NavLink[] = [];
  switch (role) {
    case 'admin':
      navLinks = adminNavLinks;
      break;
    case 'teacher':
      navLinks = teacherNavLinks;
      break;
    case 'student':
    default:
      navLinks = studentNavLinks;
      break;
  }

  return (
    <>
      <SidebarHeader>
        <div className="p-4">
          <Logo />
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
