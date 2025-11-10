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
import { Class } from '@/lib/placeholder-data';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2']),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC']),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, { message: "Format attendu: AAAA-AAAA" }),
});

type FormValues = z.infer<typeof formSchema>;

type EditClassDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    onClassUpdated: (updatedClass: Omit<Class, 'id' | 'teacherIds' | 'studentIds' | 'createdAt'>) => Promise<void>;
}

export function EditClassDialog({ isOpen, setIsOpen, classData, onClassUpdated }: EditClassDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      niveau: classData.niveau,
      filiere: classData.filiere,
      anneeScolaire: classData.anneeScolaire,
    },
  });

  const { niveau, filiere } = useWatch({ control: form.control });
  const className = React.useMemo(() => {
    if (niveau && filiere) {
        return `${niveau} ${filiere}`;
    }
    return '';
  }, [niveau, filiere]);


  React.useEffect(() => {
    form.reset({
      niveau: classData.niveau,
      filiere: classData.filiere,
      anneeScolaire: classData.anneeScolaire,
    });
  }, [classData, form]);

  async function onSubmit(values: FormValues) {
     if (!className) return;
    await onClassUpdated({ name: className, ...values });
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la classe ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Niveau</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
             <FormItem>
                <FormLabel>Nom de la classe (généré)</FormLabel>
                <FormControl>
                    <Input value={className} disabled placeholder="Ex: L3 IG" />
                </FormControl>
             </FormItem>
             <FormField
              control={form.control}
              name="anneeScolaire"
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
              <Button type="submit" disabled={form.formState.isSubmitting || !className}>
                {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}