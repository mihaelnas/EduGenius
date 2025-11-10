
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
import { useAuth, useFirestore, errorEmitter } from '@/firebase';
import { createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateAndAssignStudent } from '@/ai/flows/validate-student-flow';
import { StudentValidationInput } from '@/lib/placeholder-data';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'Le prénom est requis.' })
    .refine(
      (val) => val.length === 0 || val.charAt(0) === val.charAt(0).toUpperCase(),
      {
        message: 'Le prénom doit commencer par une majuscule.',
      }
    ),
  lastName: z
    .string()
    .min(1, { message: 'Le nom est requis.' })
    .refine((val) => val.length === 0 || val === val.toUpperCase(), {
      message: 'Le nom doit être en majuscules.',
    }),
  username: z
    .string()
    .min(2, {
      message: "Le nom d'utilisateur est requis et doit commencer par @",
    })
    .startsWith('@', { message: "Le nom d'utilisateur doit commencer par @." }),
  email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
  password: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
  matricule: z.string().min(1, { message: 'Le matricule est requis.' }),
  dateDeNaissance: z.string().min(1, { message: 'La date de naissance est requise.' }),
  lieuDeNaissance: z.string().min(1, { message: 'Le lieu de naissance est requis.' }),
  genre: z.enum(['Homme', 'Femme'], { required_error: 'Le genre est requis.'}),
  telephone: z.string().optional(),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2'], { required_error: 'Le niveau est requis.'}),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC'], { required_error: 'La filière est requise.'}),
  photo: z.string().url({ message: 'Veuillez entrer une URL valide.' }).optional().or(z.literal('')),
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
      username: '@',
      email: '',
      password: '',
      confirmPassword: '',
      matricule: '',
      dateDeNaissance: '',
      lieuDeNaissance: '',
      telephone: '',
      photo: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let user;
    let toastId: string | undefined;

    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      user = userCredential.user;

      // Step 2: Create user profile object for Firestore
      const userProfile = {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        username: values.username,
        role: 'student' as const,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        matricule: values.matricule,
        dateDeNaissance: values.dateDeNaissance,
        lieuDeNaissance: values.lieuDeNaissance,
        genre: values.genre,
        telephone: values.telephone,
        niveau: values.niveau,
        filiere: values.filiere,
        photo: values.photo,
      };
      
      if (!userProfile.photo) { delete (userProfile as Partial<typeof userProfile>).photo; }
      if (!userProfile.telephone) { delete (userProfile as Partial<typeof userProfile>).telephone; }

      // Step 3: Save user profile to Firestore with 'pending' status
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, userProfile).catch((error) => {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: userProfile,
         }));
         throw error; // Re-throw to be caught by the outer try-catch
      });

      // Step 4: Trigger the background validation flow and wait for it
      toastId = toast({
        title: 'Vérification des données...',
        description: 'Nous contactons l\'administration pour valider vos informations.',
        duration: Infinity
      }).id;

      const validationInput: StudentValidationInput = {
        userId: user.uid,
        matricule: values.matricule,
        firstName: values.firstName,
        lastName: values.lastName,
        niveau: values.niveau,
        filiere: values.filiere,
      };
      
      const validationResult = await validateAndAssignStudent(validationInput);
      if (toastId) dismiss(toastId);

      if (validationResult.status === 'success') {
        // Step 5: Automation successful
        toast({ 
          title: 'Validation réussie !', 
          description: 'Votre compte a été activé. Vous pouvez maintenant vous connecter.',
          duration: 5000 
        });
      } else {
        // If API validation fails, notify user but keep account 'pending'
        // The error message from the flow is now more descriptive
        toast({
          variant: 'destructive',
          title: 'Échec de la validation automatique',
          description: validationResult.message || 'La validation a échoué. Un administrateur examinera votre compte.',
          duration: 8000
        });
      }
      
      // In both cases (success or handled failure of validation), log out and redirect to login
      await signOut(auth);
      router.push('/login');

    } catch (error: any) {
      if (toastId) dismiss(toastId);
      
      // Cleanup: if anything fails during the process, delete the auth user
      // This is for unhandled errors like Firestore permission issues, network errors, etc.
      if (user) {
        await deleteUser(user).catch(deleteError => {
            console.error("Failed to clean up auth user:", deleteError);
            toast({
                variant: 'destructive',
                title: 'Erreur de nettoyage',
                description: 'Impossible de supprimer l\'utilisateur temporaire. Veuillez contacter l\'assistance.',
            });
        });
      }

      let errorMessage = 'Une erreur est survenue. Vérifiez les informations et réessayez.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse e-mail est déjà utilisée. Veuillez vous connecter.';
      } else if (error.message) {
        // Display the specific error message, which could come from the flow
        errorMessage = error.message;
      }
      
      toast({
          variant: 'destructive',
          title: 'Échec de l\'inscription',
          description: errorMessage,
          duration: 8000
      });

      // Do not redirect on unhandled error, let the user see the error and try again
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
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Créer un compte étudiant</CardTitle>
        <CardDescription>
          Rejoignez EduGenius aujourd'hui. C'est gratuit !
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <ScrollArea className="h-[60vh] lg:h-auto">
            <CardContent className="grid gap-4 px-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} onBlur={handlePrenomBlur} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} onBlur={handleNomBlur} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Nom d'utilisateur</FormLabel><FormControl><Input placeholder="@jeandupont" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="nom@exemple.com" type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Mot de passe</FormLabel><div className="relative"><FormControl><Input type={showPassword ? 'text' : 'password'} {...field} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</Button></div><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirmer le mot de passe</FormLabel><div className="relative"><FormControl><Input type={showConfirmPassword ? 'text' : 'password'} {...field} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(prev => !prev)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</Button></div><FormMessage /></FormItem> )} />
                
                <hr className="my-2 border-border" />
                
                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="Ex: 1814 H-F" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="dateDeNaissance" render={({ field }) => ( <FormItem><FormLabel>Date de Naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="lieuDeNaissance" render={({ field }) => ( <FormItem><FormLabel>Lieu de Naissance</FormLabel><FormControl><Input placeholder="Dakar" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner le genre" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone <span className='text-xs text-muted-foreground'>(Optionnel)</span></FormLabel><FormControl><Input placeholder="77 123 45 67" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="niveau" render={({ field }) => ( <FormItem><FormLabel>Niveau</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner le niveau" /></SelectTrigger></FormControl><SelectContent>{['L1', 'L2', 'L3', 'M1', 'M2'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="filiere" render={({ field }) => ( <FormItem><FormLabel>Filière</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner la filière" /></SelectTrigger></FormControl><SelectContent>{['IG', 'GB', 'ASR', 'GID', 'OCC'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
                 <FormField control={form.control} name="photo" render={({ field }) => ( <FormItem><FormLabel>URL de la photo <span className='text-xs text-muted-foreground'>(Optionnel)</span></FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
          </ScrollArea>
          <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-4">
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Inscription en cours..." : "S'inscrire"}
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
