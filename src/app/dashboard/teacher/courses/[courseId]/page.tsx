
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Course } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const courseDocRef = useMemoFirebase(() => {
    // Only create the reference if we have the necessary IDs
    if (!firestore || !courseId || !user?.uid) return null;
    return doc(firestore, 'courses', courseId);
  }, [firestore, courseId, user?.uid]);

  const { data: course, isLoading: isLoadingCourse, error } = useDoc<Course>(courseDocRef);

  if (isUserLoading) {
    return (
        <div>
            <h1>Authentification en cours...</h1>
            <Skeleton className="h-40 w-full mt-4" />
        </div>
    );
  }

  return (
    <div className="p-4 bg-card rounded-lg font-mono text-sm">
        <h1 className="text-xl font-bold font-sans mb-4">Page de Diagnostic du Cours</h1>
        
        <div className="mb-2">
            <strong>ID du cours (depuis l'URL):</strong> {courseId || "Non trouvé"}
        </div>
        <div className="mb-2">
            <strong>ID de l'utilisateur connecté:</strong> {user?.uid || "Non connecté"}
        </div>
         <div className="mb-4">
            <strong>Référence du document Firestore:</strong> {courseDocRef ? courseDocRef.path : "N/A (en attente des IDs)"}
        </div>

        <hr className="my-4 border-dashed" />

        <h2 className="text-lg font-bold font-sans mb-2">État de la récupération des données :</h2>
        <div className="mb-2">
            <strong>Chargement (isLoading): </strong> 
            <span className={isLoadingCourse ? 'text-yellow-400' : 'text-green-400'}>
                {JSON.stringify(isLoadingCourse)}
            </span>
        </div>
        <div className="mb-2">
            <strong>Erreur: </strong>
             <span className={error ? 'text-red-400' : 'text-green-400'}>
                {error ? error.message : "null"}
             </span>
        </div>
        
        <hr className="my-4 border-dashed" />

        <h2 className="text-lg font-bold font-sans mb-2">Données brutes du cours :</h2>
        <pre className="p-2 border rounded bg-background whitespace-pre-wrap">
            {JSON.stringify(course, null, 2) || "Données non disponibles"}
        </pre>
        
        {course && (
             <div className="mt-4 border-t pt-4">
                <h2 className="text-lg font-bold font-sans mb-2">Champs spécifiques :</h2>
                <p><strong>Titre:</strong> {course.title}</p>
                <p><strong>Contenu:</strong> {course.content}</p>
             </div>
        )}
    </div>
  );
}
