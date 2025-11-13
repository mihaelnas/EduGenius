
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { toast, dismiss } = useToast();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // This effect runs only on the client
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

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
          duration: Infinity,
        });
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [toast, dismiss]);

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
       <head>
        <title>EduGenius</title>
        <meta name="description" content="La plateforme éducative du futur." />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <AuthProvider>
            {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
