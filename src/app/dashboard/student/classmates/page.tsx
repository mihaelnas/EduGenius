
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getDisplayName, EtudiantDetail, Class } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StudentClassmatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentClass, setStudentClass] = React.useState<Class | null>(null);
  const [classmates, setClassmates] = React.useState<EtudiantDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchClassmates = async () => {
      setIsLoading(true);
      try {
        const [classData, classmatesData] = await Promise.all([
            apiFetch(`dashboard/etudiant/${user.id}/classe`).catch(() => null),
            apiFetch(`dashboard/etudiant/${user.id}/classe/etudiants`).catch(() => [])
        ]);
        setStudentClass(classData);
        // Exclut l'utilisateur actuel de la liste des camarades
        setClassmates((classmatesData || []).filter((c: EtudiantDetail) => c.id_etudiant.toString() !== user.id.toString()));
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger la liste des camarades." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassmates();
  }, [user, toast]);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Camarades de Classe</h1>
      {isLoading ? (
        <Skeleton className="h-5 w-1/2" />
      ) : studentClass ? (
        <p className="text-muted-foreground">Voici les autres étudiants de la classe de {studentClass.nom_classe}.</p>
      ) : (
        <p className="text-muted-foreground">Vous n'êtes actuellement inscrit(e) dans aucune classe.</p>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="text-center space-y-2">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-20" />
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : (
          classmates.map((student) => (
            <Card key={student.id_etudiant} className="text-center transition-transform transform hover:-translate-y-1">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-muted-foreground/20">
                  <AvatarImage src={student.photo_url} alt={getDisplayName(student)} />
                  <AvatarFallback>{(student.prenom || '').charAt(0)}{(student.nom || '').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{getDisplayName(student)}</p>
                  <p className="text-xs text-muted-foreground">{student.nom_utilisateur}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!isLoading && classmates.length === 0 && (
         <div className="flex flex-col items-center justify-center h-64 border rounded-lg mt-6">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-xl font-semibold mt-4">Personne pour le moment</p>
            <p className="text-muted-foreground mt-2">
                {studentClass ? "Vous êtes le seul étudiant dans cette classe." : "Inscrivez-vous à une classe pour voir vos camarades."}
            </p>
         </div>
      )}
    </>
  );
}
