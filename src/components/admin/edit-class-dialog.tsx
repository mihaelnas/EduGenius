
'use client';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppUser, Class } from '@/lib/placeholder-data';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  nom_classe: z.string().min(1, "Le nom de la classe est requis."),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2'], { required_error: "Le niveau est requis." }),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC'], { required_error: "La filière est requise." }),
  annee_scolaire: z.string().regex(/^\d{4}-\d{4}$/, { message: "Format attendu: AAAA-AAAA" }),
  effectif: z.coerce.number().min(0),
  id_enseignant: z.array(z.number())
});

type FormValues = z.infer<typeof formSchema>;

type EditClassDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    allTeachers: AppUser[];
    onClassUpdated: (updatedClass: any) => Promise<void>;
}

export function EditClassDialog({ isOpen, setIsOpen, classData, onClassUpdated }: EditClassDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (classData) {
      form.reset({
        nom_classe: classData.nom_classe,
        niveau: classData.niveau,
        filiere: classData.filiere,
        annee_scolaire: classData.annee_scolaire,
        effectif: classData.effectif,
        id_enseignant: classData.enseignants.map(e => e.id)
      });
    }
  }, [classData, form]);

  async function onSubmit(values: FormValues) {
    await onClassUpdated({
      ...values,
      enseignants: values.id_enseignant.map(id => ({ id })) // API might need full object, adjust if needed
    });
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la classe ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <FormField
              control={form.control}
              name="nom_classe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la classe</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Niveau</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {['L1', 'L2', 'L3', 'M1', 'M2'].map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="filiere"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Filière</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une filière" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {['IG', 'GB', 'ASR', 'GID', 'OCC'].map(filiere => (
                            <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             
             <FormField
              control={form.control}
              name="annee_scolaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Année Scolaire</FormLabel>
                  <FormControl>
                    <Input placeholder="2023-2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
