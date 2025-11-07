'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';

const formSchema = z.object({
  photo: z.string().url({ message: 'Veuillez entrer une URL d\'image valide.' }).or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type UpdatePhotoDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentPhotoUrl?: string;
    onUpdate: (newPhotoUrl: string) => void;
};

export function UpdatePhotoDialog({ isOpen, setIsOpen, currentPhotoUrl, onUpdate }: UpdatePhotoDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      photo: currentPhotoUrl || '',
    },
  });
  
  const photoValue = form.watch('photo');

  React.useEffect(() => {
    form.setValue('photo', currentPhotoUrl || '');
  }, [currentPhotoUrl, form]);

  function onSubmit(values: FormValues) {
    onUpdate(values.photo);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mettre à jour la photo de profil</DialogTitle>
          <DialogDescription>
            Collez une nouvelle URL pour changer votre photo de profil.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-4">
            <Avatar className="h-24 w-24">
                <AvatarImage src={photoValue || currentPhotoUrl} />
                <AvatarFallback>
                    <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la photo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
