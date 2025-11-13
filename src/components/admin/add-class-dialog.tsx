
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
import { AppUser, Class, getDisplayName } from '@/lib/placeholder-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2'], { required_error: "Le niveau est requis." }),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC'], { required_error: "La filière est requise." }),
  groupe: z.coerce.number().min(1, { message: "Le groupe est requis."}).optional(), // Groupe est optionnel, le nom sera généré
  annee_scolaire: z.string().regex(/^\d{4}-\d{4}$/, { message: "Format attendu: AAAA-AAAA" }),
  id_enseignant: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AddClassDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onClassAdded: (newClass: Omit<Class, 'id_classe' | 'enseignants' | 'effectif'> & {id_enseignant: number[]}) => Promise<void>;
    allTeachers: AppUser[];
};

export function AddClassDialog({ isOpen, setIsOpen, onClassAdded, allTeachers }: AddClassDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      id_enseignant: [],
    },
  });

  const { niveau, filiere } = useWatch({ control: form.control });
  const className = React.useMemo(() => {
    if (niveau && filiere) {
        return `${niveau}-${filiere}`.toUpperCase();
    }
    return '';
  }, [niveau, filiere]);

  async function onSubmit(values: FormValues) {
    if (!className) return;
    
    const payload = {
        nom_classe: className,
        niveau: values.niveau,
        filiere: values.filiere,
        annee_scolaire: values.annee_scolaire,
        id_enseignant: values.id_enseignant || [],
    };
    // @ts-ignore
    await onClassAdded(payload);
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
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une classe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle classe</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle classe.
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
                            <SelectValue placeholder="Sélectionner..." />
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
                            <SelectValue placeholder="Sélectionner..." />
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
                    <Input value={className} disabled placeholder="Ex: L1-IG" />
                </FormControl>
             </FormItem>
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
               <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || !className}>
                {form.formState.isSubmitting ? "Création..." : "Créer la classe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
