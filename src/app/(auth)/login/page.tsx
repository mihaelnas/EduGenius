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
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { AppUser } from '@/lib/placeholder-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email requis',
        description: 'Veuillez entrer une adresse e-mail.',
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Email envoyé',
        description: 'Un lien de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.',
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'envoyer l'e-mail. Vérifiez que l'adresse est correcte.",
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
           toast({
              variant: 'destructive',
              title: 'Échec de la connexion',
              description: "Profil utilisateur non trouvé. Votre compte a peut-être été supprimé.",
          });
          await signOut(auth); // Important: log out the user
          return;
        }
        
        const userProfile = userDoc.data() as AppUser;

        if (userProfile.status !== 'active') {
           toast({
              variant: 'destructive',
              title: 'Compte non activé',
              description: "Votre compte est en attente ou inactif. Veuillez contacter un administrateur.",
              duration: 7000
          });
          await signOut(auth); // Log out the user because their account is not ready
          return;
        }
        
        // The layout will handle the redirection, removing the race condition.

      } catch (e) {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
          // We don't re-throw here, as the global listener will handle it.
          // The error toast will be shown by the listener's fallback mechanism.
          await signOut(auth); // Log out the user to prevent being stuck in a broken state
          return;
      }


    } catch (error: any) {
       let description = 'Identifiants incorrects. Veuillez réessayer.';
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'Email ou mot de passe invalide. Veuillez vérifier vos informations.';
       } else if (error.code === 'auth/too-many-requests') {
          description = 'Accès temporairement désactivé en raison de trop nombreuses tentatives. Réessayez plus tard.';
       } else if (error instanceof FirestorePermissionError) {
          // This type of error is handled by the global error listener, so we don't show a toast here.
          return;
       }

      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: description,
      });
    }
  }

  return (
    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Ravi de vous revoir !</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre compte.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nom@exemple.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                      <div className="flex items-center">
                          <FormLabel>Mot de passe</FormLabel>
                          <AlertDialogTrigger asChild>
                              <Button variant="link" className="ml-auto p-0 h-auto text-xs" onClick={() => {
                                  setResetEmail(form.getValues('email'))
                              }}>
                                  Mot de passe oublié ?
                              </Button>
                          </AlertDialogTrigger>
                      </div>
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                 {form.formState.isSubmitting ? 'Connexion...' : 'Se connecter'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Vous n'avez pas de compte ?{' '}
                <Link href="/register" className="underline text-primary">
                  Inscrivez-vous
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
          <AlertDialogDescription>
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                  id="reset-email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
              />
          </div>
          <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handlePasswordReset}>Envoyer le lien</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
