
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getDisplayName, Student, Class, AppUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

export default function StudentClassmatesPage() {
  
  // Data fetching logic is removed. Replace with calls to your new backend.
  const studentClass: Class | null = null;
  const classmates: Student[] = [];
  const isLoading = true; // Set to true while fetching data from your API

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Camarades de Classe</h1>
      {isLoading ? (
        <Skeleton className="h-5 w-1/2" />
      ) : studentClass ? (
        <p className="text-muted-foreground">Voici les autres étudiants de la classe de {studentClass.name}.</p>
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
            <Card key={student.id} className="text-center transition-transform transform hover:-translate-y-1">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-muted-foreground/20">
                  <AvatarImage src={student.photo} alt={getDisplayName(student)} />
                  <AvatarFallback>{(student.firstName || '').charAt(0)}{(student.lastName || '').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{getDisplayName(student)}</p>
                  <p className="text-xs text-muted-foreground">{student.username}</p>
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
