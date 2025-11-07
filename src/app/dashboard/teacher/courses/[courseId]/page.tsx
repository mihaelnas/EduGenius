
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherCourseDetailPage({ params }: { params: { courseId: string } }) {
  // J'utilise React.use() pour être compatible avec Next.js, mais la page est maintenant statique.
  const { courseId } = React.use(params);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Page de test du cours</CardTitle>
        </CardHeader>
        <CardContent>
            <h1 className="text-2xl font-bold text-primary">Voici le cours</h1>
            <p className="text-muted-foreground mt-2">
                Si vous voyez ce message, cela signifie que la page est accessible.
            </p>
            <p className="mt-4">
                ID du cours demandé depuis l'URL : <span className="font-mono bg-muted p-1 rounded-md">{courseId}</span>
            </p>
            <p className="mt-4">
                La prochaine étape sera de réintégrer la récupération des données depuis Firestore.
            </p>
        </CardContent>
    </Card>
  );
}
