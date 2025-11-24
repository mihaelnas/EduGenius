
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Class } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherClassesPage() {
  const [teacherClasses, setTeacherClasses] = React.useState<Class[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch(`dashboard/enseignant/${user.id}/classes`);
        setTeacherClasses(data || []);
      } catch (error: any) {
        if (error.message.includes('404')) {
            setTeacherClasses([]);
        } else {
            toast({
              variant: 'destructive',
              title: 'Erreur de chargement',
              description: error.message,
            });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, [toast, user]);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Classes</h1>
      <p className="text-muted-foreground mb-6">Voici les classes qui vous sont assignées pour l'année en cours.</p>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : teacherClasses && teacherClasses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teacherClasses.map((c) => (
            <Card key={c.id_classe} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{c.nom_classe}</CardTitle>
                <CardDescription>Année Scolaire {c.annee_scolaire}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{c.effectif} étudiant(s)</span>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                      <Link href={`/dashboard/teacher/classes/${c.id_classe}`}>Voir la classe <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
            <p className="text-xl font-semibold">Aucune classe ne vous est assignée</p>
            <p className="text-muted-foreground mt-2">Veuillez contacter un administrateur pour vous faire assigner à une classe.</p>
        </div>
      )}
    </>
  );
}
