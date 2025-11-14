
'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

export default function MyProfilePage() {
  
  const { user, isLoading: isUserLoading } = useAuth();

  useEffect(() => {
    if (!isUserLoading && user) {
      redirect(`/dashboard/profile/${user.id}`);
    }
    if (!isUserLoading && !user) {
      redirect('/login');
    }
  }, [user, isUserLoading]);

  return (
    <div className="space-y-8">
        <div className="flex items-center space-x-4 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
    </div>
  );
}
