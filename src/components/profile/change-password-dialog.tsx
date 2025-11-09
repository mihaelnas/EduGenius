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
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Le mot de passe actuel est requis.' }),
  newPassword: z.string().min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les nouveaux mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

type ChangePasswordDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function ChangePasswordDialog({ isOpen, setIsOpen }: ChangePasswordDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non connecté.' });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email!, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, values.newPassword);

      toast({
        title: 'Mot de passe changé',
        description: 'Votre mot de passe a été mis à jour avec succès.',
      });
      setIsOpen(false);
      
    } catch (error: any) {
      let description = 'Une erreur est survenue.';
       if (error.code === 'auth/invalid-credential') {
        description = 'Le mot de passe actuel que vous avez entré est incorrect.';
      } else if (error.code === 'auth/weak-password') {
        description = 'Le nouveau mot de passe est trop faible.';
      } else if (error.code === 'auth/requires-recent-login') {
          description = 'Cette opération est sensible et nécessite une authentification récente. Veuillez vous déconnecter et vous reconnecter avant de réessayer.';
      }
      toast({
        variant: 'destructive',
        title: 'Échec du changement de mot de passe',
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
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Pour changer votre mot de passe, veuillez d'abord entrer votre mot de passe actuel.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
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
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
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
                 {form.formState.isSubmitting ? 'Changement...' : 'Changer le mot de passe'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
