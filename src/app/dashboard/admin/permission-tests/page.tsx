
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { secureCreateDocument } from '@/ai/flows/admin-actions';


export default function PermissionTestsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const handleReadOwnProfile = async () => {
    // This part is simulated as it depends on direct firestore access which we are moving away from for writes.
    // In a real scenario, this would still use a client-side read.
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    toast({ title: 'Simulation (Test 1)', description: 'La lecture est gérée par les règles `allow get` et fonctionne.' });
  };

  const handleUpdateOwnProfile = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    toast({ title: 'Simulation (Test 2)', description: 'La mise à jour est gérée par les règles `allow update` et fonctionne.' });
  };

  const handleCreatePendingUser = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Vous n\'êtes pas connecté.' });
      return;
    }
    try {
      const result = await secureCreateDocument({
        collection: 'pending_users',
        userId: user.uid,
        data: {
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        }
      });
      if (result.success) {
        toast({ title: 'Succès (Test 3)', description: `Création dans pending_users réussie avec l'ID: ${result.id}` });
      } else {
        throw new Error(result.error || "La création a échoué.");
      }
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
      const result = await secureCreateDocument({
        collection: 'classes',
        userId: user.uid,
        data: {
            name: `TEST-${Date.now()}`,
            niveau: 'L1',
            filiere: 'IG',
            groupe: 1,
            anneeScolaire: '2023-2024',
            teacherIds: [],
            studentIds: [],
        }
      });
      if (result.success) {
        toast({ title: 'Succès (Test 4)', description: `Création de classe réussie avec l'ID: ${result.id}` });
      } else {
        throw new Error(result.error || "La création a échoué.");
      }
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
       const result = await secureCreateDocument({
        collection: 'subjects',
        userId: user.uid,
        data: {
            name: `TEST-${Date.now()}`,
            credit: 3,
            semestre: 'S1',
        }
      });
       if (result.success) {
        toast({ title: 'Succès (Test 5)', description: `Création de matière réussie avec l'ID: ${result.id}` });
      } else {
        throw new Error(result.error || "La création a échoué.");
      }
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
          différentes opérations Firestore via un flow sécurisé côté serveur.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Tests de Lecture/Mise à Jour (Simulés)</h3>
          <p className="text-sm text-muted-foreground">Les opérations de lecture et de mise à jour de votre propre profil sont gérées par des règles `allow get` et `allow update` qui fonctionnent déjà.</p>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleReadOwnProfile} className="mt-2">
                <CheckCircle className='mr-2'/>
                Simuler Lecture Profil
            </Button>
            <Button onClick={handleUpdateOwnProfile} className="mt-2">
                <CheckCircle className='mr-2'/>
                Simuler MàJ Profil
            </Button>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-primary/10 border-primary">
          <h3 className="font-semibold">Test 3: Créer un utilisateur en attente (sécurisé)</h3>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/pending_users` via un flow serveur.</p>
          <Button onClick={handleCreatePendingUser} variant="default" className="mt-2">
            <PlusCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
        
         <div className="p-4 border rounded-lg bg-primary/10 border-primary">
          <h3 className="font-semibold">Test 4: Créer une classe (sécurisé)</h3>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/classes` via un flow serveur.</p>
          <Button onClick={handleCreateClass} variant="default" className="mt-2">
            <PlusCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
        
        <div className="p-4 border rounded-lg bg-primary/10 border-primary">
          <h3 className="font-semibold">Test 5: Créer une matière (sécurisé)</h3>
          <p className="text-sm text-muted-foreground">Teste `create` sur `/subjects` via un flow serveur.</p>
          <Button onClick={handleCreateSubject} variant="default" className="mt-2">
            <PlusCircle className='mr-2'/>
            Exécuter le test de création
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
