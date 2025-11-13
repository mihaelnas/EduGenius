
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AppUser } from '@/lib/placeholder-data';

export function UserNav() {
  const router = useRouter();

  // This would come from your new auth context
  const user: (AppUser & { uid: string }) | null = {
      uid: '1',
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      username: '@admin',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
  }; 
  const isUserLoading = false;

  const handleLogout = async () => {
    // API call to your backend logout endpoint
    console.log('Logging out...');
    router.push('/login');
  };
  
  if (isUserLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  const displayEmail = user?.email || '';
  const photoURL = user?.photo;
  const fallback = user ? (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '') : 'U';


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={photoURL} alt={displayName} />
            <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </>
        ) : (
           <DropdownMenuItem onClick={() => router.push('/login')}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Se connecter</span>
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
