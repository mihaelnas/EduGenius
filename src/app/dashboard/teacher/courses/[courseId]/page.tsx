
'use client';

import React from 'react';

// Ce composant est un test. Il n'utilise AUCUN hook de données.
// Il est conçu pour être aussi simple que possible.

export default function TeacherCourseDetailPage() {
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Page de Test Statique</h1>
      <p style={{ marginTop: '1rem' }}>Si vous voyez ce message, la page et son routage fonctionnent.</p>
      <hr style={{ margin: '2rem 0' }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Titre du Cours (Statique):</h2>
      <p>Titre de test codé en dur</p>
      <br />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Contenu du Cours (Statique):</h2>
      <p>Ceci est le contenu de test codé en dur pour le cours.</p>
    </div>
  );
}
