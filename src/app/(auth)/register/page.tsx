
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
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  prenom: z
    .string()
    .min(1, { message: 'Le prénom est requis.' })
    .refine(
      (val) => val.length === 0 || val.charAt(0) === val.charAt(0).toUpperCase(),
      {
        message: 'Le prénom doit commencer par une majuscule.',
      }
    ),
  nom: z
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
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      username: '@',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user profile with 'admin' role
      const userProfile = {
        id: user.uid,
        firstName: values.prenom,
        lastName: values.nom,
        email: values.email,
        role: 'admin', 
      };
      
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      // Create admin role document
      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      setDocumentNonBlocking(adminRoleRef, { createdAt: new Date().toISOString() }, {});

      toast({
        title: 'Inscription réussie',
        description: 'Compte administrateur créé. Vous pouvez maintenant vous connecter.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        variant: 'destructive',
        title: 'Échec de l\'inscription',
        description: error.message || 'Une erreur est survenue.',
      });
    }
  }

  const handlePrenomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const formattedValue =
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      form.setValue('prenom', formattedValue, { shouldValidate: true });
    }
  };

  const handleNomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const formattedValue = value.toUpperCase();
      form.setValue('nom', formattedValue, { shouldValidate: true });
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez EduGenius aujourd'hui. C'est gratuit !
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jean"
                        {...field}
                        onBlur={handlePrenomBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DUPONT"
                        {...field}
                        onBlur={handleNomBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="@jeandupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">
              S'inscrire
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
