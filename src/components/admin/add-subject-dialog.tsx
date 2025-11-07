
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
  DialogTrigger,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Le nom de la matière est requis.' }),
  credit: z.coerce.number().min(1, { message: 'Les crédits sont requis.' }),
  semestre: z.enum(['S1', 'S2']),
  photo: z.string().url({ message: 'Veuillez entrer une URL valide pour la photo.' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type AddSubjectDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSubjectAdded: (newSubject: FormValues) => void;
}

export function AddSubjectDialog({ isOpen, setIsOpen, onSubjectAdded }: AddSubjectDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      credit: 1,
      photo: '',
    },
  });

  function onSubmit(values: FormValues) {
    onSubjectAdded(values);
    setIsOpen(false);
    form.reset();
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une matière
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle matière</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle matière.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la matière</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Algorithmique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="credit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Crédits</FormLabel>
                        <FormControl>
                            <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="semestre"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Semestre</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un semestre" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="S1">S1</SelectItem>
                                <SelectItem value="S2">S2</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la photo (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemple.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
              <Button type="submit">Créer la matière</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
