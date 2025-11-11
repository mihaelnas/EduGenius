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
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { AppUser } from '@/lib/placeholder-data';

const baseSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  matricule: z.string().min(1, { message: 'Matricule requis.' }),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2']),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC']),
  groupe: z.coerce.number().min(1, "Le groupe est requis"),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('teacher'),
  specialite: z.string().min(1, "La spécialité est requise."),
});

const adminSchema = baseSchema.extend({
    role: z.literal('admin'),
});


const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema, adminSchema]);

export type AddUserFormValues = z.infer<typeof formSchema>;

type AddUserDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUserAdded: (userProfile: Omit<AppUser, 'id' | 'email' | 'username' | 'status' | 'createdAt'>) => void;
}

const initialValues: Partial<AddUserFormValues> = {
  role: 'student',
  firstName: '',
  lastName: '',
};

export function AddUserDialog({ isOpen, setIsOpen, onUserAdded }: AddUserDialogProps) {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues as any,
  });

  const role = useWatch({
    control: form.control,
    name: 'role',
  });

  function onSubmit(values: AddUserFormValues) {
    let userProfile: Omit<AppUser, 'id' | 'email' | 'username' | 'status' | 'createdAt'>;

    switch (values.role) {
      case 'student':
        userProfile = {
          role: 'student',
          firstName: values.firstName,
          lastName: values.lastName,
          matricule: values.matricule.toUpperCase(),
          niveau: values.niveau,
          filiere: values.filiere,
          groupe: values.groupe
        };
        break;
      case 'teacher':
        userProfile = {
          role: 'teacher',
          firstName: values.firstName,
          lastName: values.lastName,
          specialite: values.specialite.toUpperCase(),
        };
        break;
      case 'admin':
        userProfile = {
          role: 'admin',
          firstName: values.firstName,
          lastName: values.lastName,
        };
        break;
    }
    onUserAdded(userProfile);
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(initialValues as any);
    }
  };

  const handlePrenomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('firstName', value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(), { shouldValidate: true });
    }
  };

  const handleNomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('lastName', value.toUpperCase(), { shouldValidate: true });
    }
  };
  
  const handleMatriculeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && 'matricule' in form.getValues()) {
        form.setValue('matricule', value.toUpperCase(), { shouldValidate: true });
    }
  };

  const handleSpecialiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && 'specialite' in form.getValues()) {
        form.setValue('specialite', value.toUpperCase(), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Pré-inscrire un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pré-inscrire un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Crée un compte utilisateur avec le statut 'Inactif'. L'utilisateur devra l'activer lui-même en s'inscrivant avec son matricule, nom et prénom.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[60vh] pr-6">
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Rôle</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="student">Étudiant</SelectItem>
                                        <SelectItem value="teacher">Enseignant</SelectItem>
                                        <SelectItem value="admin">Administrateur</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
            
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Jean" {...field} onBlur={handlePrenomBlur} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="DUPONT" {...field} onBlur={handleNomBlur} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        
                        {role === 'student' && (
                            <>
                                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="E123456" {...field} onBlur={handleMatriculeBlur} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                <FormField control={form.control} name="niveau" render={({ field }) => ( <FormItem><FormLabel>Niveau</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['L1', 'L2', 'L3', 'M1', 'M2'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="filiere" render={({ field }) => ( <FormItem><FormLabel>Filière</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['IG', 'GB', 'ASR', 'GID', 'OCC'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="groupe" render={({ field }) => ( <FormItem><FormLabel>Groupe</FormLabel><FormControl><Input type="number" min="1" placeholder="Ex: 1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </>
                        )}

                        {role === 'teacher' && (
                            <>
                                <FormField control={form.control} name="specialite" render={({ field }) => ( <FormItem><FormLabel>Spécialité</FormLabel><FormControl><Input placeholder="Mathématiques" {...field} onBlur={handleSpecialiteBlur} /></FormControl><FormMessage /></FormItem> )} />
                            </>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className='pt-4'>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Création..." : "Pré-inscrire l'utilisateur"}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
