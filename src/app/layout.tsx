
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { FirebaseClientProvider, UserProvider } from '@/firebase';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Since we are making this a client component, we can't export metadata directly.
// We'll rely on the static metadata generation if needed, or handle it differently.
// export const metadata: Metadata = {
//   title: 'EduGenius',
//   description: 'La plateforme éducative du futur.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { toast, dismiss } = useToast();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => {
      dismiss('offline-toast');
      toast({
        title: 'De retour en ligne',
        description: 'La connexion à Internet a été rétablie.',
      });
      setIsOnline(true);
    };

    const handleOffline = () => {
      toast({
        id: 'offline-toast',
        variant: 'destructive',
        title: 'Vous êtes hors ligne',
        description: 'Vérifiez votre connexion Internet. Certaines fonctionnalités pourraient être indisponibles.',
        duration: Infinity, // Keep it visible until online again
      });
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, dismiss]);

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
       <head>
        {/* We can place static meta tags here */}
        <title>EduGenius</title>
        <meta name="description" content="La plateforme éducative du futur." />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <FirebaseClientProvider>
          <UserProvider>
            {children}
          </UserProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
