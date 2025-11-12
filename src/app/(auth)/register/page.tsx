
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
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import React from 'react';
import { Eye, EyeOff, UserCog } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { activateAccount } from '@/app/actions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Schéma de base commun
const baseSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
});

// Schéma pour l'utilisateur standard (avec matricule)
const userSchema = baseSchema.extend({
  matricule: z.string().min(1, { message: 'Le matricule est requis.' }),
});

// Schéma pour l'admin (sans matricule)
const adminSchema = baseSchema.extend({
  matricule: z.string().optional(), // Le matricule est optionnel pour l'admin
});


// Combine les schémas
const formSchema = z.discriminatedUnion("isRegisteringAsAdmin", [
    userSchema.extend({ isRegisteringAsAdmin: z.literal(false) }),
    adminSchema.extend({ isRegisteringAsAdmin: z.literal(true) })
]).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});


export default function RegisterPage() {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const auth = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isRegisteringAsAdmin, setIsRegisteringAsAdmin] = React.useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      password: '',
      confirmPassword: '',
      isRegisteringAsAdmin: false,
    },
    mode: 'onBlur',
  });
  
  // Mettre à jour la valeur dans le formulaire lorsque l'état change
  React.useEffect(() => {
    form.setValue('isRegisteringAsAdmin', isRegisteringAsAdmin);
  }, [isRegisteringAsAdmin, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    let toastId: string | undefined;
    try {
      toastId = toast({
        title: 'Vérification en cours...',
        description: 'Finalisation de votre compte...',
        duration: Infinity
      }).id;

      // 1. Create the Auth user first
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newAuthUser = userCredential.user;

      // 2. Call the secure server-side action to handle the database transaction and custom claims
      const result = await activateAccount({
        matricule: values.matricule || '',
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        newAuthUserId: newAuthUser.uid,
      });

      if (!result.success) {
        // If the action fails, delete the created auth user to allow them to try again.
        await newAuthUser.delete();
        throw new Error(result.error || "La transaction de base de données a échoué.");
      }
      
      // Special handling for admin to force token refresh and stay logged in
      if (result.userProfile?.role === 'admin') {
          await newAuthUser.getIdToken(true); // Force refresh to get custom claims
          if (toastId) dismiss(toastId);
          toast({ title: 'Compte administrateur créé !', description: 'Redirection vers le tableau de bord...', duration: 5000 });
          router.push('/dashboard');
          return;
      }

      // 3. For regular users, sign out immediately after activation
      await signOut(auth);

      if (toastId) dismiss(toastId);
      toast({ 
          title: 'Compte activé avec succès !', 
          description: 'Vous pouvez maintenant vous connecter avec vos identifiants.',
          duration: 8000 
      });
      
      // 4. Redirect to the login page
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
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="text-2xl font-headline">Activer votre compte</CardTitle>
                <CardDescription>
                  {isRegisteringAsAdmin 
                    ? "Remplissez les champs pour créer un compte administrateur."
                    : "Finalisez votre inscription pour activer votre compte pré-créé."
                  }
                </CardDescription>
            </div>
             <div className="flex items-center space-x-2 pt-1">
                <Label htmlFor="admin-mode" className="text-sm font-medium flex items-center gap-2">
                    <UserCog className="h-4 w-4"/>
                    Admin
                </Label>
                <Switch 
                    id="admin-mode" 
                    checked={isRegisteringAsAdmin}
                    onCheckedChange={setIsRegisteringAsAdmin}
                />
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <ScrollArea className="h-auto">
            <CardContent className="grid gap-4 px-6">
                {!isRegisteringAsAdmin && (
                    <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="Ex: 1814 H-F" {...field} /></FormControl><FormMessage /></FormItem> )} />
                )}
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
