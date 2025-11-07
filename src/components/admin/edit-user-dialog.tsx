
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
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { AppUser } from '@/lib/placeholder-data';
import { useAuth } from '@/firebase';
import { sendPasswordReset } from '@/lib/auth-actions';
import { useToast } from '@/hooks/use-toast';

const baseSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }),
  username: z.string().min(2, { message: "Le nom d'utilisateur est requis." }).startsWith('@', { message: 'Doit commencer par @.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  photo: z.string().url({ message: 'URL invalide.' }).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  newPassword: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères.").optional().or(z.literal('')),
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

const adminSchema = baseSchema.extend({
    role: z.literal('admin'),
});

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema, adminSchema]);
type FormValues = z.infer<typeof formSchema>;


type EditUserDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: AppUser;
    onUserUpdated: (updatedUser: AppUser) => void;
}

export function EditUserDialog({ isOpen, setIsOpen, user, onUserUpdated }: EditUserDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (user) {
      const defaultValues: any = {
        ...user,
        photo: user.photo ?? '',
        telephone: (user as any).telephone ?? '',
        adresse: (user as any).adresse ?? '',
        emailPro: (user as any).emailPro ?? '',
        specialite: (user as any).specialite ?? '',
        genre: (user as any).genre ?? undefined,
        newPassword: '',
      };
      form.reset(defaultValues);
    }
  }, [user, form]);

  const role = useWatch({
    control: form.control,
    name: 'role',
  });
  
  async function onSubmit(values: FormValues) {
    const { newPassword, ...userData } = values;

    if (newPassword && newPassword.length > 0) {
        try {
            await sendPasswordReset(auth, user.email);
            toast({
                title: 'Email de réinitialisation envoyé',
                description: `Un e-mail a été envoyé à ${user.email} pour réinitialiser le mot de passe.`,
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Erreur',
                description: `Impossible d'envoyer l'e-mail de réinitialisation : ${error.message}`,
            });
        }
    }

    const finalValues: AppUser = {
        ...user,
        ...userData,
    };
    
    if (finalValues.photo === '') {
        delete (finalValues as Partial<AppUser>).photo;
    }

    onUserUpdated(finalValues);
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier un utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'utilisateur.
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

                        <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Nom d'utilisateur</FormLabel><FormControl><Input placeholder="@jeandupont" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="nom@exemple.com" type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                         <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Laisser vide pour ne pas changer" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Statut</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un statut" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Actif</SelectItem>
                                        <SelectItem value="inactive">Inactif</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        {role === 'student' && 'matricule' in form.getValues() && (
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

                        {role === 'teacher' && 'specialite' in form.getValues() && (
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
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
                    <Button type="submit">Sauvegarder les modifications</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
