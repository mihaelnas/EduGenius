
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

const baseSchema = z.object({
  role: z.enum(['etudiant', 'enseignant']),
  prenom: z.string().min(1, { message: 'Le prénom est requis.' }),
  nom: z.string().min(1, { message: 'Le nom est requis.' }),
  nom_utilisateur: z.string().min(2, { message: "Le nom d'utilisateur est requis." }).startsWith('@', { message: 'Doit commencer par @.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  mot_de_passe: z.string().min(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' }),
  photo_url: z.string().url({ message: 'URL invalide.' }).optional().or(z.literal('')),
  genre: z.enum(['Homme', 'Femme']).optional(),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
});

const studentSchema = baseSchema.extend({
  role: z.literal('etudiant'),
  matricule: z.string().min(1, { message: 'Matricule requis.' }),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2'], { required_error: 'Le niveau est requis.'}),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC'], { required_error: 'La filière est requise.'}),
  date_naissance: z.string().optional().or(z.literal('')),
  lieu_naissance: z.string().optional().or(z.literal('')),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('enseignant'),
  specialite: z.string().min(1, "La spécialité est requise."),
  email_professionnel: z.string().email({ message: 'Email pro invalide.' }).optional().or(z.literal('')),
});

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema]);
export type AddUserFormValues = z.infer<typeof formSchema>;

type AddUserDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUserAdded: (values: AddUserFormValues) => Promise<void>;
}

const studentDefaults = {
  matricule: '',
  niveau: undefined,
  filiere: undefined,
  date_naissance: '',
  lieu_naissance: ''
};

const teacherDefaults = {
  specialite: '',
  email_professionnel: ''
};

const initialValues: Partial<AddUserFormValues> = {
  role: 'etudiant',
  prenom: '',
  nom: '',
  nom_utilisateur: '@',
  email: '',
  mot_de_passe: '',
  photo_url: '',
  genre: undefined,
  telephone: '',
  adresse: '',
  ...studentDefaults,
  ...teacherDefaults
};

export function AddUserDialog({ isOpen, setIsOpen, onUserAdded }: AddUserDialogProps) {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues as AddUserFormValues,
  });

  const role = useWatch({
    control: form.control,
    name: 'role',
  });

  async function onSubmit(values: AddUserFormValues) {
    await onUserAdded(values);
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(initialValues as AddUserFormValues);
    }
  };

  const handlePrenomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('prenom', value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(), { shouldValidate: true });
    }
  };

  const handleNomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('nom', value.toUpperCase(), { shouldValidate: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau profil.
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
                                        <SelectItem value="etudiant">Étudiant</SelectItem>
                                        <SelectItem value="enseignant">Enseignant</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
            
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="prenom" render={({ field }) => ( <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="RAKOTO" {...field} onBlur={handlePrenomBlur} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="nom" render={({ field }) => ( <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="RAJOHARISOA" {...field} onBlur={handleNomBlur} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        
                        <FormField control={form.control} name="nom_utilisateur" render={({ field }) => ( <FormItem><FormLabel>Nom d'utilisateur</FormLabel><FormControl><Input placeholder="@rakoto" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="rakoto@exemple.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mot_de_passe" render={({ field }) => ( <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        <hr className="my-4"/>

                        {role === 'etudiant' && (
                            <>
                                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="1814 H-F" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name="date_naissance" render={({ field }) => ( <FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                  <FormField control={form.control} name="lieu_naissance" render={({ field }) => ( <FormItem><FormLabel>Lieu de naissance</FormLabel><FormControl><Input placeholder="Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="niveau" render={({ field }) => ( <FormItem><FormLabel>Niveau</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['L1', 'L2', 'L3', 'M1', 'M2'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="filiere" render={({ field }) => ( <FormItem><FormLabel>Filière</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['IG', 'GB', 'ASR', 'GID', 'OCC'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                </div>
                            </>
                        )}

                        {role === 'enseignant' && (
                            <>
                                <FormField control={form.control} name="specialite" render={({ field }) => ( <FormItem><FormLabel>Spécialité</FormLabel><FormControl><Input placeholder="Mathématiques" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="email_professionnel" render={({ field }) => ( <FormItem><FormLabel>Email Professionnel</FormLabel><FormControl><Input type="email" placeholder="rakoto@univ.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </>
                        )}

                        <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre (Optionnel)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone (Optionnel)</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="adresse" render={({ field }) => ( <FormItem><FormLabel>Adresse (Optionnel)</FormLabel><FormControl><Input placeholder="123 Rue de Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="photo_url" render={({ field }) => ( <FormItem><FormLabel>URL Photo (Optionnel)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                </ScrollArea>
                <DialogFooter className='pt-4'>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Création..." : "Ajouter l'utilisateur"}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
