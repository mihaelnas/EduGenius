
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
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          setRole('student'); // Default role
        }
      });
    } else if (!isUserLoading) {
       setRole('student'); // Default for non-logged-in users for demo
    }
  }, [user, firestore, isUserLoading]);

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

  if (isUserLoading || !role) {
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
