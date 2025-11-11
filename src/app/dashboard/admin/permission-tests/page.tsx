
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { AlertCircle, CheckCircle, DatabaseZap, FileCheck, FilePlus, FileText } from 'lucide-react';
import { AppUser } from '@/lib/placeholder-data';

export default function PermissionTestsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleReadOwnProfile = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non connecté.' });
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as AppUser;
        toast({
          title: 'Succès de la lecture !',
          description: `Profil lu avec succès. Rôle détecté : ${userData.role}`,
          className: 'bg-green-100 dark:bg-green-900 border-green-400',
        });
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Votre document utilisateur n\'a pas été trouvé.' });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Échec de la lecture du profil',
        description: error.message,
      });
    }
  };

  const handleCreatePendingUser = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non connecté.' });
      return;
    }
    const newPendingUser = {
      role: 'student',
      firstName: 'Test',
      lastName: 'USER',
      matricule: `TEST${Date.now()}`,
      niveau: 'L1',
      filiere: 'IG',
      groupe: 1,
    };
    // Use addDoc for collections
    const pendingUsersCollectionRef = collection(firestore, 'pending_users');
    try {
      await addDoc(pendingUsersCollectionRef, newPendingUser);
      toast({
        title: 'Succès de la création !',
        description: 'Utilisateur de test créé dans pending_users.',
        className: 'bg-green-100 dark:bg-green-900 border-green-400',
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Échec de la création dans pending_users',
        description: error.message,
        duration: 9000,
      });
    }
  };
  
   const handleUpdateOwnProfile = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non connecté.' });
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        await updateDoc(userDocRef, {
            username: `@test${Date.now()}`
        });
      toast({
          title: 'Succès de la mise à jour !',
          description: 'Votre profil a été mis à jour avec succès.',
          className: 'bg-green-100 dark:bg-green-900 border-green-400',
        });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Échec de la mise à jour du profil',
        description: error.message,
        duration: 9000,
      });
    }
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Tests de Permissions Firestore</h1>
        <p className="text-muted-foreground">
          Cliquez sur les boutons pour tester les règles de sécurité.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actions de test</CardTitle>
          <CardDescription>Chaque bouton déclenche une opération Firestore spécifique. Observez les notifications pour voir le résultat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className='flex items-center gap-2'>
                <FileText className='text-primary'/>
                <h3 className="font-semibold">Test 1: Lire son propre profil</h3>
            </div>
            <p className="text-sm text-muted-foreground">Teste `get` sur `/users/[votreId]`. Nécessaire pour que `isAdmin()` fonctionne.</p>
            <Button onClick={handleReadOwnProfile}>
                <CheckCircle className='mr-2'/>
                Exécuter le test de lecture
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className='flex items-center gap-2'>
                <FilePlus className='text-primary'/>
                <h3 className="font-semibold">Test 2: Créer un utilisateur en attente</h3>
            </div>
            <p className="text-sm text-muted-foreground">Teste `create` sur `/pending_users/[docId]`. C'est l'opération qui échoue actuellement.</p>
            <Button onClick={handleCreatePendingUser}>
                <AlertCircle className='mr-2'/>
                Exécuter le test de création
            </Button>
          </div>
          
           <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className='flex items-center gap-2'>
                <FileCheck className='text-primary'/>
                <h3 className="font-semibold">Test 3: Mettre à jour son profil</h3>
            </div>
            <p className="text-sm text-muted-foreground">Teste `update` sur `/users/[votreId]`.</p>
            <Button onClick={handleUpdateOwnProfile}>
                <DatabaseZap className='mr-2'/>
                Exécuter le test de mise à jour
            </Button>
          </div>

        </CardContent>
      </Card>
    </>
  );
}
