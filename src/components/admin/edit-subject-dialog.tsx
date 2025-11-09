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
import { Subject } from '@/lib/placeholder-data';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { debounce } from 'lodash';

const semestres = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'] as const;

const formSchema = z.object({
  name: z.string().min(1, { message: 'Le nom de la matière est requis.' }),
  credit: z.coerce.number().min(1, { message: 'Les crédits sont requis.' }),
  semestre: z.enum(semestres),
  photo: z.string().url({ message: 'Veuillez entrer une URL valide pour la photo.' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type EditSubjectDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    subject: Subject;
    onSubjectUpdated: (updatedSubject: FormValues) => void;
}

export function EditSubjectDialog({ isOpen, setIsOpen, subject, onSubjectUpdated }: EditSubjectDialogProps) {
  const firestore = useFirestore();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: subject,
  });

  const subjectNameValue = useWatch({
    control: form.control,
    name: 'name',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkSubjectNameUniqueness = useCallback(
    debounce(async (name: string) => {
      if (!name || name.toUpperCase() === subject.name.toUpperCase()) {
        form.clearErrors('name');
        return;
      };
      const subjectsRef = collection(firestore, 'subjects');
      const q = query(subjectsRef, where('name', '==', name.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
         form.setError('name', {
            type: 'manual',
            message: 'Ce nom de matière existe déjà.',
          });
      } else {
        form.clearErrors('name');
      }
    }, 500),
    [firestore, form, subject.name]
  );
  
  useEffect(() => {
    if (subjectNameValue) {
      checkSubjectNameUniqueness(subjectNameValue);
    }
  }, [subjectNameValue, checkSubjectNameUniqueness]);


  React.useEffect(() => {
    if (isOpen) {
      form.reset(subject);
    }
  }, [subject, form, isOpen]);

  async function onSubmit(values: FormValues) {
    const finalValues = {
        ...values,
        name: values.name.toUpperCase(),
    };

    if (finalValues.name !== subject.name.toUpperCase()) {
        const subjectsRef = collection(firestore, 'subjects');
        const q = query(subjectsRef, where('name', '==', finalValues.name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            form.setError('name', {
                type: 'manual',
                message: 'Ce nom de matière existe déjà.',
            });
            return;
        }
    }
    
    onSubjectUpdated(finalValues);
    setIsOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(subject);
    }
  }

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('name', value.toUpperCase(), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la matière</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la matière ci-dessous.
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
                    <Input placeholder="Ex: ALGORITHMIQUE" {...field} onBlur={handleNameBlur}/>
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
