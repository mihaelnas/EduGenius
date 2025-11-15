
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
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';


const formSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer un email valide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isResetLoading, setIsResetLoading] = React.useState(false);

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
    setIsResetLoading(true);
    try {
        await apiFetch('/auth/reset-password-request', { 
            method: 'POST',
            body: JSON.stringify({ email: resetEmail }),
        });
        toast({
            title: 'Demande envoyée',
            description: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
        });
        setIsResetDialogOpen(false);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: error.message || 'Une erreur est survenue.',
        });
    } finally {
        setIsResetLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await login(values.email, values.password);
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
              <Button className="w-full" type="submit" disabled={isLoading}>
                 {isLoading ? 'Connexion...' : 'Se connecter'}
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
                  disabled={isResetLoading}
              />
          </div>
          <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handlePasswordReset} disabled={isResetLoading}>
            {isResetLoading ? 'Envoi...' : 'Envoyer le lien'}
          </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
