
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
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    // In a real app, you would get the role from an auth provider.
    // For this demo, we'll get it from localStorage. This ensures it only runs on the client.
    const storedRole = localStorage.getItem('userRole');
    if (storedRole && ['admin', 'teacher', 'student'].includes(storedRole)) {
      setRole(storedRole);
    } else {
      setRole('student'); // Default to student if nothing is found or role is invalid
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

  // Render a loading state or nothing while the role is being determined
  if (!role) {
    return (
      <>
        <SidebarHeader>
          <div className="p-4">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* You can add a skeleton loader here if you want */}
        </SidebarContent>
      </>
    )
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
