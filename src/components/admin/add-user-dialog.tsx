
'use client';

import React, { useCallback, useEffect } from 'react';
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
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { debounce } from 'lodash';

const baseSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  username: z.string().min(2, { message: "Le nom d'utilisateur est requis." }).startsWith('@', { message: 'Doit commencer par @.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  photo: z.string().url({ message: 'URL invalide.' }).optional().or(z.literal('')),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  matricule: z.string().min(1, { message: 'Matricule requis.' }),
  dateDeNaissance: z.string().min(1, { message: 'Date de naissance requise.' }),
  lieuDeNaissance: z.string().min(1, { message: 'Lieu de naissance requis.' }),
  genre: z.enum(['Homme', 'Femme']),
  telephone: z.string().min(1, { message: 'Téléphone requis.' }),
  adresse: z.string().min(1, { message: 'Adresse requise.' }),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2']),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC']),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('teacher'),
  emailPro: z.string().email({ message: 'Email pro invalide.' }),
  genre: z.enum(['Homme', 'Femme']),
  telephone: z.string().min(1, { message: 'Téléphone requis.' }),
  adresse: z.string().min(1, { message: 'Adresse requise.' }),
  specialite: z.string().min(1, { message: 'Spécialité requise.' }),
});

const adminSchema = baseSchema.extend({
    role: z.literal('admin'),
});

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema, adminSchema]);
type FormValues = z.infer<typeof formSchema>;

type AddUserDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUserAdded: (newUser: Omit<AppUser, 'id' | 'status' | 'createdAt'>) => void;
}

const initialValues = {
  role: 'student' as const,
  firstName: '',
  lastName: '',
  username: '@',
  email: '',
  photo: '',
  // Student fields
  matricule: '',
  dateDeNaissance: '',
  lieuDeNaissance: '',
  telephone: '',
  adresse: '',
  niveau: undefined,
  filiere: undefined,
  genre: undefined,
  // Teacher fields
  emailPro: '',
  specialite: '',
};

export function AddUserDialog({ isOpen, setIsOpen, onUserAdded }: AddUserDialogProps) {
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const role = useWatch({
    control: form.control,
    name: 'role',
  });
  
  const usernameValue = useWatch({
    control: form.control,
    name: 'username',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username && username.length > 1) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          form.setError('username', {
            type: 'manual',
            message: 'Ce nom d\'utilisateur est déjà pris.',
          });
        } else {
          form.clearErrors('username');
        }
      }
    }, 500),
    [firestore, form]
  );

  useEffect(() => {
    if (role === 'student') {
        checkUsername(usernameValue);
    }
  }, [usernameValue, role, checkUsername]);


  async function onSubmit(values: FormValues) {
    if (values.role === 'student') {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('username', '==', values.username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            form.setError('username', {
                type: 'manual',
                message: "Ce nom d'utilisateur est déjà pris.",
            });
            return;
        }
    }

    onUserAdded(values);
    setIsOpen(false);
    form.reset(initialValues);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(initialValues);
    }
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau profil utilisateur dans Firestore. L'utilisateur devra s'inscrire séparément pour créer son compte d'authentification.
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                        <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Nom d'utilisateur</FormLabel><FormControl><Input placeholder="@jeandupont" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="nom@exemple.com" type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        {role === 'student' && (
                            <>
                                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input placeholder="E123456" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="dateDeNaissance" render={({ field }) => ( <FormItem><FormLabel>Date de Naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="lieuDeNaissance" render={({ field }) => ( <FormItem><FormLabel>Lieu de Naissance</FormLabel><FormControl><Input placeholder="Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="adresse" render={({ field }) => ( <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue de Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="niveau" render={({ field }) => ( <FormItem><FormLabel>Niveau</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['L1', 'L2', 'L3', 'M1', 'M2'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="filiere" render={({ field }) => ( <FormItem><FormLabel>Filière</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{['IG', 'GB', 'ASR', 'GID', 'OCC'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                </div>
                            </>
                        )}

                        {role === 'teacher' && (
                            <>
                                <FormField control={form.control} name="emailPro" render={({ field }) => ( <FormItem><FormLabel>Email Professionnel</FormLabel><FormControl><Input placeholder="nom@univ.edu" type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="adresse" render={({ field }) => ( <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue de Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="specialite" render={({ field }) => ( <FormItem><FormLabel>Spécialité</FormLabel><FormControl><Input placeholder="Mathématiques" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </>
                        )}
                        <FormField control={form.control} name="photo" render={({ field }) => ( <FormItem><FormLabel>URL de la photo (Optionnel)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                </ScrollArea>
                <DialogFooter className='pt-4'>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
                    <Button type="submit">Créer l'utilisateur</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    