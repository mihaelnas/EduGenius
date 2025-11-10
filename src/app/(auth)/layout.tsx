
'use client';

import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const bgImage = placeholderImages.find(p => p.id === 'auth-background');
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered');

  useEffect(() => {
    // Redirect if user is loaded, logged in, and didn't just come from the registration page.
    // This prevents the immediate redirection to /dashboard for a newly created user
    // who still needs to go through the validation flow on the client.
    if (!isUserLoading && user && !justRegistered) {
      redirect('/dashboard');
    }
  }, [user, isUserLoading, justRegistered]);

  // Show a loading skeleton while we're checking auth state or if the user is logged in
  // and we haven't determined if they just registered.
  if (isUserLoading || (user && !justRegistered)) {
    return (
       <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
         <div className="mb-8">
            <Logo />
         </div>
         <Skeleton className="w-full max-w-sm h-[450px]" />
       </div>
    )
  }

  // If loading is finished and there's no user (or they just registered and were logged out),
  // show the auth pages (login/register).
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
