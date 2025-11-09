
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
import { Eye, EyeOff, PlusCircle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';

const baseSchema = z.object({
  role: z.enum(['student', 'teacher']),
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  username: z.string().min(2, { message: "Le nom d'utilisateur est requis." }).startsWith('@', { message: 'Doit commencer par @.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
  confirmPassword: z.string(),
  photo: z.string().url({ message: 'URL invalide.' }).optional().or(z.literal('')),
});

const studentSchema = baseSchema.extend({
  role: z.literal('student'),
  matricule: z.string().min(1, { message: 'Matricule requis.' }),
  dateDeNaissance: z.string().min(1, { message: 'Date de naissance requise.' }),
  lieuDeNaissance: z.string().min(1, { message: 'Lieu de naissance requis.' }),
  genre: z.enum(['Homme', 'Femme']),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  niveau: z.enum(['L1', 'L2', 'L3', 'M1', 'M2']),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC']),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('teacher'),
  emailPro: z.string().email({ message: 'Email pro invalide.' }).optional().or(z.literal('')),
  genre: z.enum(['Homme', 'Femme']).optional(),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  specialite: z.string().optional().or(z.literal('')),
});

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema])
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type AddUserFormValues = z.infer<typeof formSchema>;

type AddUserDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUserAdded: (newUser: AddUserFormValues) => Promise<void>;
}

const initialValues = {
  role: 'student' as const,
  firstName: '',
  lastName: '',
  username: '@',
  email: '',
  password: '',
  confirmPassword: '',
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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const role = useWatch({
    control: form.control,
    name: 'role',
  });

  async function onSubmit(values: AddUserFormValues) {
     if (values.role === 'teacher' && values.specialite) {
      values.specialite = values.specialite.toUpperCase();
    }
    await onUserAdded(values);
    setIsOpen(false);
    form.reset(initialValues);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(initialValues);
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

  const handleSpecialiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      form.setValue('specialite', value.toUpperCase(), { shouldValidate: true });
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
            Remplissez les informations pour créer un nouveau profil et un compte d'authentification.
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
                        
                        <FormField 
                          control={form.control} 
                          name="password" 
                          render={({ field }) => ( 
                            <FormItem>
                              <FormLabel>Mot de passe</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input placeholder="8+ caractères" type={showPassword ? 'text' : 'password'} {...field} />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(prev => !prev)}>
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem> 
                          )} 
                        />
                        <FormField 
                          control={form.control} 
                          name="confirmPassword" 
                          render={({ field }) => ( 
                            <FormItem>
                              <FormLabel>Confirmer le mot de passe</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input placeholder="Retapez le mot de passe" type={showConfirmPassword ? 'text' : 'password'} {...field} />
                                </FormControl>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(prev => !prev)}>
                                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem> 
                          )} 
                        />
                        
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
                                <FormField control={form.control} name="emailPro" render={({ field }) => ( <FormItem><FormLabel>Email Professionnel</FormLabel><FormControl><Input placeholder="nom@univ.edu" type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="adresse" render={({ field }) => ( <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue de Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="specialite" render={({ field }) => ( <FormItem><FormLabel>Spécialité</FormLabel><FormControl><Input placeholder="Mathématiques" {...field} onBlur={handleSpecialiteBlur} /></FormControl><FormMessage /></FormItem> )} />
                            </>
                        )}
                        <FormField control={form.control} name="photo" render={({ field }) => ( <FormItem><FormLabel>URL de la photo (Optionnel)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                </ScrollArea>
                <DialogFooter className='pt-4'>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Création..." : "Créer l'utilisateur"}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
