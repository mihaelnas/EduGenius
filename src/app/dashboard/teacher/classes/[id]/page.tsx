
'use client';

import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { classes, users, getDisplayName, Student, AppUser } from '@/lib/placeholder-data';
import React from 'react';

export default function TeacherClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;

  const currentClass = React.useMemo(() => classes.find(c => c.id === classId), [classId]);
  const studentsInClass = React.useMemo(() => {
    if (!currentClass) return [];
    return users.filter(user => currentClass.studentIds.includes(user.id)) as Student[];
  }, [currentClass]);

  if (!currentClass) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-2xl font-bold">Classe non trouvée</p>
        <p className="text-muted-foreground">La classe que vous recherchez n'existe pas.</p>
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
                <CardTitle className="font-headline text-2xl">{currentClass.name}</CardTitle>
                <CardDescription>
                    {currentClass.filiere} - {currentClass.niveau} | Année Scolaire: {currentClass.anneeScolaire}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg mb-4">Liste des Étudiants ({studentsInClass.length})</h3>
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
                            <TableRow key={student.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.photo} alt={getDisplayName(student)} />
                                    <AvatarFallback>{student.prenom.charAt(0)}{student.nom.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <span className="font-semibold">{getDisplayName(student)}</span>
                                    <span className="text-xs text-muted-foreground">{student.username}</span>
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
                                   <div className="flex items-center gap-2">
                                     <Phone className="h-3 w-3 text-muted-foreground" />
                                     <span>{student.telephone}</span>
                                   </div>
                                </div>
                            </TableCell>
                            <TableCell>{student.genre}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
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
