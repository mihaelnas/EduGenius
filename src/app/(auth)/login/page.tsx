
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
import { users, getDisplayName } from '@/lib/placeholder-data';

const formSchema = z.object({
  login: z.string().min(1, { message: 'Ce champ est requis.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Mock login logic
    const user = users.find(u => u.email === values.login || u.username === values.login);

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Échec de la connexion',
            description: 'Identifiants incorrects. Veuillez réessayer.',
        });
        return;
    }

    toast({
      title: 'Connexion réussie',
      description: 'Redirection vers votre tableau de bord...',
    });
    
    // Store role and other info in localStorage for demonstration purposes
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', getDisplayName(user));
    }

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  }

  return (
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
              name="login"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Email ou Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="nom@exemple.com ou @votrepseudo" {...field} />
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
              Se connecter
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
  );
}

    