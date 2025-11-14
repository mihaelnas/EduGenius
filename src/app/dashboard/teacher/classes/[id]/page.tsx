
'use client';

import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDisplayName, AppUser, Class, EtudiantDetail } from '@/lib/placeholder-data';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

export default function TeacherClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentClass, setCurrentClass] = React.useState<Class | null>(null);
  const [studentsInClass, setStudentsInClass] = React.useState<EtudiantDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!classId || !user) return;

    const fetchClassDetails = async () => {
        setIsLoading(true);
        try {
            const [classData, studentsData] = await Promise.all([
                apiFetch(`/enseignant/${user.id}/classes/${classId}`),
                apiFetch(`/enseignant/${user.id}/classes/${classId}/etudiants`)
            ]);
            setCurrentClass(classData);
            setStudentsInClass(studentsData || []);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erreur de chargement',
                description: error.message || "Impossible de charger les détails de la classe.",
            });
            setCurrentClass(null); // Force l'affichage du message "non trouvé"
        } finally {
            setIsLoading(false);
        }
    };

    fetchClassDetails();
  }, [classId, toast, user]);

  if (isLoading) {
    return (
        <div>
            <Skeleton className="h-9 w-40 mb-4" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-1/4 mb-4" />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Matricule</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Genre</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!currentClass) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-2xl font-bold">Classe non trouvée</p>
        <p className="text-muted-foreground">La classe que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
        <Button asChild className="mt-4">
            <Link href="/dashboard/teacher/classes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à mes classes
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/teacher/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à mes classes
          </Link>
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-2xl">{currentClass.nom_classe}</CardTitle>
                <CardDescription>
                    {currentClass.filiere} - {currentClass.niveau} | Année Scolaire: {currentClass.annee_scolaire}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg mb-4">Liste des Étudiants ({studentsInClass.length})</h3>
                    <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Matricule</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Genre</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {studentsInClass.map((student) => (
                            <TableRow key={student.id_etudiant}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.photo_url} alt={getDisplayName(student)} />
                                    <AvatarFallback>{(student.prenom || '').charAt(0)}{(student.nom || '').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <span className="font-semibold">{getDisplayName(student)}</span>
                                    <span className="text-xs text-muted-foreground">{student.nom_utilisateur}</span>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">{student.matricule}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 text-xs">
                                   <div className="flex items-center gap-2">
                                     <Mail className="h-3 w-3 text-muted-foreground" />
                                     <a href={`mailto:${student.email}`} className="hover:underline">{student.email}</a>
                                   </div>
                                   {student.telephone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span>{student.telephone}</span>
                                    </div>
                                   )}
                                </div>
                            </TableCell>
                            <TableCell>{student.genre}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                     {studentsInClass.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Aucun étudiant n'est inscrit dans cette classe pour le moment.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
