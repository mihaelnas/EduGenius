
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';

export default function PermissionTestsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleReadOwnProfile = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        toast({ title: 'Succès (Test 1)', description: 'Lecture de votre propre profil réussie.' });
      } else {
        toast({ variant: 'destructive', title: 'Échec (Test 1)', description: 'Votre document utilisateur n\'a pas été trouvé.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Échec (Test 1)', description: e.message });
    }
  };

  const handleUpdateOwnProfile = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { lastTested: Timestamp.now() }, { merge: true });
      toast({ title: 'Succès (Test 2)', description: 'Mise à jour de votre profil réussie.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Échec (Test 2)', description: e.message });
    }
  };

  const handleCreatePendingUser = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const pendingUsersRef = collection(firestore, 'pending_users');
      await addDoc(pendingUsersRef, {
        test: true,
        createdAt: Timestamp.now(),
      });
      toast({ title: 'Succès (Test 3)', description: 'Création dans pending_users réussie.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Échec (Test 3)', description: e.message });
    }
  };

  const handleCreateClass = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const classesRef = collection(firestore, 'classes');
      await addDoc(classesRef, {
        name: `TEST-${Date.now()}`,
        niveau: 'L1',
        filiere: 'IG',
        groupe: 1,
        anneeScolaire: '2023-2024',
        teacherIds: [],
        studentIds: [],
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Succès (Test 4)', description: 'Création de classe réussie.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Échec (Test 4)', description: e.message });
    }
  };

  const handleCreateSubject = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const subjectsRef = collection(firestore, 'subjects');
      await addDoc(subjectsRef, {
        name: `TEST-${Date.now()}`,
        credit: 3,
        semestre: 'S1',
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Succès (Test 5)', description: 'Création de matière réussie.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Échec (Test 5)', description: e.message });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Tests de Permissions Firestore</CardTitle>
        <p className="text-muted-foreground">
          Cette page permet de diagnostiquer les problèmes de permissions en testant
          différentes opérations Firestore par rapport aux règles de sécurité.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Test 1: Lire son propre profil</h3>
          </div>
          <p className="text-sm text-muted-foreground">Teste `get` sur `/users/[votreId]`. Nécessaire pour que `isAdmin()` fonctionne.</p>
          <Button onClick={handleReadOwnProfile} className="mt-2">
            <CheckCircle className='mr-2'/>
            Exécuter le test de lecture
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Test 2: Mettre à jour son profil</h3>
          </div>
          <p className="text-sm text-muted-foreground">Teste `update` sur `/users/[votreId]`.</p>
          <Button onClick={handleUpdateOwnProfile} className="mt-2">
            <CheckCircle className='mr-2'/>
            Exécuter le test de mise à jour
          </Button>
        </div>
        
        <div className="p-4 border rounded-lg bg-destructive/10 border-destructive">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Test 3: Créer un utilisateur en attente</h3>
          </div>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/pending_users/[docId]`. C'est l'opération qui échoue actuellement.</p>
          <Button onClick={handleCreatePendingUser} variant="destructive" className="mt-2">
            <AlertCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
        
         <div className="p-4 border rounded-lg bg-destructive/10 border-destructive">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Test 4: Créer une classe</h3>
          </div>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/classes/[docId]`.</p>
          <Button onClick={handleCreateClass} variant="destructive" className="mt-2">
            <PlusCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
        
        <div className="p-4 border rounded-lg bg-destructive/10 border-destructive">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Test 5: Créer une matière</h3>
          </div>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/subjects/[docId]`.</p>
          <Button onClick={handleCreateSubject} variant="destructive" className="mt-2">
            <PlusCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
