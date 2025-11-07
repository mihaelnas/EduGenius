'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { users, classes, getDisplayName, AppUser, Student } from '@/lib/placeholder-data';

// Mock: assumes the logged in student is Bob Williams (id: usr_3)
const STUDENT_ID = 'usr_3';

export default function StudentClassmatesPage() {
  const [studentClass, setStudentClass] = React.useState<any>(null);
  const [classmates, setClassmates] = React.useState<Student[]>([]);

  React.useEffect(() => {
    const currentClass = classes.find(c => c.studentIds.includes(STUDENT_ID));
    if (currentClass) {
      const classmateIds = currentClass.studentIds.filter(id => id !== STUDENT_ID);
      const fetchedClassmates = users.filter(user => classmateIds.includes(user.id)) as Student[];
      setStudentClass(currentClass);
      setClassmates(fetchedClassmates);
    }
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Camarades de Classe</h1>
      {studentClass ? (
        <p className="text-muted-foreground">Voici les autres étudiants de la classe de {studentClass.name}.</p>
      ) : (
        <p className="text-muted-foreground">Recherche de vos camarades de classe...</p>
      )}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {classmates.map((student) => (
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
        ))}
      </div>
       {classmates.length === 0 && (
         <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
            <p className="text-muted-foreground">Vous êtes le seul étudiant dans cette classe pour le moment.</p>
         </div>
      )}
    </>
  );
}
