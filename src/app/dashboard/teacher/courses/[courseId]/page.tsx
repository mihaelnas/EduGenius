
'use client';

import React from 'react';
import { useParams } from 'next/navigation';

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <div>
      <h1>Page de test pour les détails du cours</h1>
      <p>L'ID du cours demandé est : {courseId}</p>
      <p>Si vous voyez ceci, la navigation fonctionne. Le problème est la récupération des données.</p>
    </div>
  );
}
