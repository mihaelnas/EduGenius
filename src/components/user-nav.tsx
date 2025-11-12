
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
import { useUser, useFirestore, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { AppUser } from '@/lib/placeholder-data';
import { doc, getDoc } from 'firebase/firestore';

export function UserNav() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = React.useState<AppUser | null>(null);

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as AppUser);
        }
      });
    } else if (!isUserLoading) {
      setUserProfile(null);
    }
  }, [user, firestore, isUserLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No need to clear session cookie manually as it's not used anymore.
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };
  
  if (isUserLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  const displayName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user?.displayName || 'Utilisateur';
  const displayEmail = userProfile?.email || user?.email || '';
  const photoURL = userProfile?.photo || user?.photoURL;
  const fallback = (userProfile?.firstName?.charAt(0) || '') + (userProfile?.lastName?.charAt(0) || '') || displayName.charAt(0);


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
