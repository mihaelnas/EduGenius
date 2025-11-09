'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, sendEmailVerification } from 'firebase/auth';

const formSchema = z.object({
  newEmail: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

type ChangeEmailDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentEmail: string;
};

export function ChangeEmailDialog({ isOpen, setIsOpen, currentEmail }: ChangeEmailDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newEmail: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non connecté.' });
      return;
    }

    if (values.newEmail === currentEmail) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'La nouvelle adresse e-mail est identique à l\'ancienne.' });
        return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email!, values.password);
      await reauthenticateWithCredential(user, credential);
      
      await updateEmail(user, values.newEmail);
      await sendEmailVerification(user);

      toast({
        title: 'Email mis à jour avec succès',
        description: 'Votre adresse e-mail a été modifiée. Veuillez vérifier votre nouvelle adresse en cliquant sur le lien que nous vous avons envoyé.',
        duration: 8000
      });
      setIsOpen(false);
      
    } catch (error: any) {
      let description = 'Une erreur est survenue.';
      if (error.code === 'auth/invalid-credential') {
        description = 'Le mot de passe que vous avez entré est incorrect.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      } else if (error.code === 'auth/requires-recent-login') {
          description = 'Cette opération est sensible et nécessite une authentification récente. Veuillez vous déconnecter et vous reconnecter avant de réessayer.';
      }
      toast({
        variant: 'destructive',
        title: 'Échec de la mise à jour',
        description: description,
      });
    }
  };
  
   const handleOpenChange = (open: boolean) => {
    if (form.formState.isSubmitting) return;
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer l'adresse e-mail</DialogTitle>
          <DialogDescription>
            Pour des raisons de sécurité, veuillez confirmer votre mot de passe pour changer votre adresse e-mail de connexion.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouvelle adresse e-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="nouvel.email@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={form.formState.isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Mise à jour...' : 'Changer l\'email'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
