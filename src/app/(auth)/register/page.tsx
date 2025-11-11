
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, writeBatch, arrayUnion, getDoc } from 'firebase/firestore';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Student, Class } from '@/lib/placeholder-data';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Schema for the "account claiming" registration process
const formSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  matricule: z.string().min(1, { message: 'Le matricule est requis.' }),
  email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let toastId: string | undefined;

    try {
      toastId = toast({
        title: 'Vérification en cours...',
        description: 'Nous vérifions vos informations de pré-inscription.',
        duration: Infinity
      }).id;

      // Step 1: Find a pre-registered, inactive account in `pending_users`
      const usersRef = collection(firestore, 'pending_users');
      const q = query(usersRef, 
        where('matricule', '==', values.matricule),
        where('status', '==', 'inactive')
      );
      
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Aucun compte en attente correspondant à ce matricule n'a été trouvé. Veuillez contacter l'administration.");
      }
      
      const matchingDocs = querySnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.firstName.toLowerCase() === values.firstName.toLowerCase() &&
                 data.lastName.toLowerCase() === values.lastName.toLowerCase();
      });

      if (matchingDocs.length === 0) {
          throw new Error("Les nom et prénom ne correspondent pas au compte pré-inscrit pour ce matricule.");
      }
      
      if (toastId) dismiss(toastId);
      toastId = toast({
        title: 'Informations validées !',
        description: 'Finalisation de votre compte...',
        duration: Infinity
      }).id;

      const pendingUserDoc = matchingDocs[0];
      const pendingUserData = pendingUserDoc.data() as Student;

      // Step 2: Create Firebase Auth user without signing in
      const tempApp = initializeApp(firebaseConfig, `temp-auth-${Date.now()}`);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
      const newAuthUser = userCredential.user;

      // Step 3: Create the final user document in 'users' collection and delete the pending one
      const batch = writeBatch(firestore);
      
      const pendingDocRef = doc(firestore, 'pending_users', pendingUserDoc.id);
      const newUserDocRef = doc(firestore, 'users', newAuthUser.uid);
      
      const newUserProfile = {
        ...pendingUserData,
        id: newAuthUser.uid, // Update the ID to the new Auth UID
        email: values.email, // Add the chosen email
        status: 'active' as const, // Automatically activate the account
        claimedAt: new Date().toISOString(),
      };
      
      batch.set(newUserDocRef, newUserProfile);
      batch.delete(pendingDocRef);

      // Step 4 (Student only): Assign student to class
      if (newUserProfile.role === 'student') {
        const student = newUserProfile as Student;
        const className = `${student.niveau}-${student.filiere}-G${student.groupe}`.toUpperCase();
        const anneeScolaire = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        
        const classesRef = collection(firestore, 'classes');
        const classQuery = query(classesRef, where('name', '==', className), where("anneeScolaire", "==", anneeScolaire));
        const classSnapshot = await getDocs(classQuery);

        if (!classSnapshot.empty) {
          const classDoc = classSnapshot.docs[0];
          batch.update(classDoc.ref, {
            studentIds: arrayUnion(newUserProfile.id)
          });
        }
      }
      
      await batch.commit();
      
      // Step 5: Success, show notification and redirect to login
      if (toastId) dismiss(toastId);
      toast({ 
          title: 'Compte activé avec succès !', 
          description: 'Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.',
          duration: 8000 
      });
      
      router.push('/login');

    } catch (error: any) {
      if (toastId) dismiss(toastId);
      
      let errorMessage = 'Une erreur est survenue. Vérifiez vos informations et réessayez.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse e-mail est déjà utilisée pour un compte actif. Veuillez vous connecter ou utiliser une autre adresse.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
          variant: 'destructive',
          title: 'Échec de l\'activation',
          description: errorMessage,
          duration: 8000
      });
    }
  }


  const handlePrenomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      form.setValue('firstName', formattedValue, { shouldValidate: true });
    }
  };

  const handleNomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const formattedValue = value.toUpperCase();
      form.setValue('lastName', formattedValue, { shouldValidate: true });
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Activer votre compte étudiant</CardTitle>
        <CardDescription>
          Finalisez votre inscription pour activer votre compte pré-créé.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <ScrollArea className="h-auto">
            <CardContent className="grid gap-4 px-6">
                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="Ex: 1814 H-F" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} onBlur={handlePrenomBlur} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} onBlur={handleNomBlur} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                
                <hr className="my-2 border-border" />
                
                <p className='text-sm font-medium text-muted-foreground'>Choisissez vos identifiants de connexion :</p>
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Votre Email</FormLabel><FormControl><Input placeholder="nom@exemple.com" type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Votre Mot de passe</FormLabel><div className="relative"><FormControl><Input type={showPassword ? 'text' : 'password'} {...field} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</Button></div><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirmer le mot de passe</FormLabel><div className="relative"><FormControl><Input type={showConfirmPassword ? 'text' : 'password'} {...field} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(prev => !prev)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</Button></div><FormMessage /></FormItem> )} />
            </CardContent>
          </ScrollArea>
          <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-4">
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Activation en cours..." : "Activer mon compte"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="underline text-primary">
                Connectez-vous
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
