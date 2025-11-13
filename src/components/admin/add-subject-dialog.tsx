
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
import { AppUser, getDisplayName } from '@/lib/placeholder-data';

const semestres = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'] as const;

const formSchema = z.object({
  nom_matiere: z.string().min(1, { message: 'Le nom de la matière est requis.' }),
  credit: z.coerce.number().min(1, { message: 'Les crédits sont requis.' }),
  semestre: z.enum(semestres, { required_error: "Le semestre est requis." }),
  photo_url: z.string().url({ message: 'Veuillez entrer une URL valide pour la photo.' }).optional().or(z.literal('')),
  id_enseignant: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AddSubjectDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSubjectAdded: (newSubject: FormValues) => Promise<void>;
    allTeachers: AppUser[];
}

export function AddSubjectDialog({ isOpen, setIsOpen, onSubjectAdded, allTeachers }: AddSubjectDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_matiere: '',
      credit: 1,
      photo_url: '',
    },
  });

  async function onSubmit(values: FormValues) {
    const finalValues = {
        ...values,
        nom_matiere: values.nom_matiere.toUpperCase(),
    };
    await onSubjectAdded(finalValues);
    setIsOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('nom_matiere', value.toUpperCase(), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une matière
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
              name="nom_matiere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la matière</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ALGORITHMIQUE" {...field} onBlur={handleNameBlur} />
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
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {semestres.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="id_enseignant"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Enseignant (Optionnel)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un enseignant" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allTeachers.map(teacher => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>{getDisplayName(teacher)}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="photo_url"
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Création...' : 'Créer la matière'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
