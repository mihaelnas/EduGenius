
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
import {
  adminNavLinks,
  teacherNavLinks,
  studentNavLinks,
  type NavLink,
} from '@/lib/nav-links';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  let navLinks: NavLink[] = [];
  switch (user?.role) {
    case 'admin':
      navLinks = adminNavLinks;
      break;
    case 'enseignant':
      navLinks = teacherNavLinks;
      break;
    case 'etudiant':
    default: // Affiche le menu étudiant par défaut ou si le rôle n'est pas encore chargé
      navLinks = studentNavLinks;
      break;
  }

  if (isLoading || !user) {
    return (
      <>
        <SidebarHeader>
          <div className="p-4">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent className='p-4 space-y-2'>
           {Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="h-8 w-full" />
           ))}
        </SidebarContent>
      </>
    );
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
                isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')}
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
