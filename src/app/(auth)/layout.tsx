
'use client';

import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const bgImage = placeholderImages.find(p => p.id === 'auth-background');

  useEffect(() => {
    if (!isUserLoading && user) {
      redirect('/dashboard');
    }
  }, [user, isUserLoading]);

  if (isUserLoading || user) {
    return (
       <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
         <div className="mb-8">
            <Logo />
         </div>
         <Skeleton className="w-full max-w-sm h-[450px]" />
       </div>
    )
  }


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
       {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-background/90 backdrop-blur-sm" />
      <div className="mb-8">
        <Logo />
      </div>
      {children}
    </div>
  );
}
