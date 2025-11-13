
'use client';

import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgImage = placeholderImages.find(p => p.id === 'auth-background');

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
