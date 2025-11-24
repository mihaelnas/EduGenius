// components/admin/edit-user-dialog.tsx
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
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

const baseSchema = z.object({
  role: z.enum(['etudiant', 'enseignant', 'admin']),
  prenom: z.string().min(1, { message: 'Le prénom est requis.' }),
  nom: z.string().min(1, { message: 'Le nom est requis.' }),
  nom_utilisateur: z.string().min(2, { message: "Le nom d'utilisateur est requis." }).startsWith('@', { message: 'Doit commencer par @.' }),
  email: z.string().email({ message: 'Email invalide.' }),
  mot_de_passe: z.string().optional().or(z.literal('')),
  photo_url: z
    .union([z.string(), z.null()])
    .optional()
    .transform(v => (v === null ? "" : (v ?? "").trim()))
    .refine(val => val === "" || /^https?:\/\/.+/.test(val), { message: "URL invalide." }),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
});

const studentSchema = baseSchema.extend({
  role: z.literal('etudiant'),
  matricule: z.string().min(1, { message: 'Le matricule est requis.' }),
  date_naissance: z.string().min(1, { message: 'La date de naissance est requise.' }),
  lieu_naissance: z.string().min(1, { message: 'Le lieu de naissance est requis.' }),
  niveau_etude: z.enum(['L1', 'L2', 'L3', 'M1', 'M2'], { required_error: 'Le niveau est requis.' }),
  filiere: z.enum(['IG', 'GB', 'ASR', 'GID', 'OCC'], { required_error: 'La filière est requise.' }),
  genre: z.enum(['Homme', 'Femme'], { required_error: 'Le genre est requis.' }),
});

const teacherSchema = baseSchema.extend({
  role: z.literal('enseignant'),
  email_professionnel: z.string().email({ message: 'Email pro invalide.' }).optional().or(z.literal('')),
  genre: z.enum(['Homme', 'Femme'], { required_error: 'Le genre est requis.' }),
  specialite: z.string().optional(),
});

const adminSchema = baseSchema.extend({ role: z.literal('admin') });

const formSchema = z.discriminatedUnion('role', [studentSchema, teacherSchema, adminSchema]);
type FormValues = z.infer<typeof formSchema>;

type EditUserDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: AppUser;
  onUserUpdated: (updatedUser: AppUser, updates: any) => void;
};

export function EditUserDialog({ isOpen, setIsOpen, user, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast();

  const defaultValues: Partial<FormValues> = {
    prenom: '',
    nom: '',
    nom_utilisateur: '@',
    email: '',
    mot_de_passe: '',
    photo_url: '',
    genre: 'Homme',
    telephone: '',
    adresse: '',
    matricule: '',
    date_naissance: '',
    lieu_naissance: '',
    niveau_etude: 'L1',
    filiere: 'IG',
    role: 'etudiant',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  React.useEffect(() => {
    const fetchAndSetUserData = async () => {
      if (user && isOpen) {
        try {
          let endpoint = '';
          if (user.role === 'etudiant') {
            endpoint = `/dashboard/admin/etudiant/${user.id}`;
          } else if (user.role === 'enseignant') {
            endpoint = `/dashboard/admin/professeur/${user.id}`;
          }

          if (endpoint) {
            const details = await apiFetch(endpoint);
            // details should contain fields like: nom, prenom, nom_utilisateur, email, plus etudiant.* or enseignant.*
            // Normalize into flat form expected by the form
            const merged = {
              ...defaultValues,
              ...user,
              ...details, // if the API returns nested keys, prefer details fields
              // ensure nested etudiant fields are flattened if returned that way
              matricule: (details?.matricule ?? details?.etudiant?.matricule) ?? '',
              date_naissance: (details?.date_naissance ?? details?.etudiant?.date_naissance) ?? '',
              lieu_naissance: (details?.lieu_naissance ?? details?.etudiant?.lieu_naissance) ?? '',
              niveau_etude: (details?.niveau_etude ?? details?.etudiant?.niveau_etude) ?? 'L1',
              filiere: (details?.filiere ?? details?.etudiant?.filiere) ?? 'IG',
              specialite: (details?.specialite ?? details?.enseignant?.specialite) ?? '',
              email_professionnel: (details?.email_professionnel ?? details?.enseignant?.email_professionnel) ?? '',
              photo_url: (details?.photo_url ?? details?.etudiant?.photo_url ?? details?.enseignant?.photo_url) ?? '',
              mot_de_passe: '',
            } as FormValues;

            form.reset(merged);
          } else {
            form.reset({ ...defaultValues, ...user, mot_de_passe: '' } as FormValues);
          }
        } catch (error: any) {
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les détails de l'utilisateur." });
          form.reset({ ...defaultValues, ...user, mot_de_passe: '' } as FormValues);
        }
      }
    };
    fetchAndSetUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  const role = useWatch({ control: form.control, name: 'role' });

  async function onSubmit(values: FormValues) {
    // build user_update: undefined => don't send, string => send
    const user_update: any = {
      nom: values.nom || undefined,
      prenom: values.prenom || undefined,
      nom_utilisateur: values.nom_utilisateur || undefined,
      email: values.email || undefined,
    };
    if (values.mot_de_passe) user_update.mot_de_passe = values.mot_de_passe;

    let specific_update: any = {};
    if (values.role === 'etudiant') {
      specific_update = {
        matricule: values.matricule || undefined,
        date_naissance: values.date_naissance ? new Date(values.date_naissance).toISOString().split('T')[0] : undefined,
        lieu_naissance: values.lieu_naissance || undefined,
        genre: values.genre || undefined,
        adresse: values.adresse || undefined,
        telephone: values.telephone || undefined,
        niveau_etude: values.niveau_etude || undefined,
        photo_url: values.photo_url === "" ? "" : (values.photo_url || undefined), // "" means explicit clear
        filiere: values.filiere || undefined,
      };
    } else if (values.role === 'enseignant') {
      specific_update = {
        specialite: (values as any).specialite || undefined,
        email_professionnel: (values as any).email_professionnel || undefined,
        genre: values.genre || undefined,
        telephone: values.telephone || undefined,
        adresse: values.adresse || undefined,
        photo_url: values.photo_url === "" ? "" : (values.photo_url || undefined),
      };
    }

    onUserUpdated(user, { user_update, specific_update });
    setIsOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (form.formState.isSubmitting) return;
    setIsOpen(open);
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
                                <Select onValueChange={field.onChange} value={field.value} disabled>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="etudiant">Étudiant</SelectItem>
                                        <SelectItem value="enseignant">Enseignant</SelectItem>
                                        <SelectItem value="admin">Administrateur</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
            
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="prenom" render={({ field }) => ( <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="nom" render={({ field }) => ( <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>

                        <FormField control={form.control} name="nom_utilisateur" render={({ field }) => ( <FormItem><FormLabel>Nom d'utilisateur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email (Connexion)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="mot_de_passe" render={({ field }) => ( <FormItem><FormLabel>Nouveau mot de passe (Optionnel)</FormLabel><FormControl><Input type="password" {...field} placeholder="Laisser vide pour ne pas changer" /></FormControl><FormMessage /></FormItem> )} />
                        

                        {role === 'etudiant' && (
                            <>
                                <hr className="my-4"/>
                                <FormField control={form.control} name="matricule" render={({ field }) => ( <FormItem><FormLabel>Matricule</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="date_naissance" render={({ field }) => ( <FormItem><FormLabel>Date de Naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="lieu_naissance" render={({ field }) => ( <FormItem><FormLabel>Lieu de Naissance</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                <FormField control={form.control} name="niveau_etude" render={({ field }) => ( <FormItem><FormLabel>Niveau</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{['L1', 'L2', 'L3', 'M1', 'M2'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="filiere" render={({ field }) => ( <FormItem><FormLabel>Filière</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{['IG', 'GB', 'ASR', 'GID', 'OCC'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                </div>
                            </>
                        )}

                        {role === 'enseignant' && (
                            <>
                                <hr className="my-4"/>
                                <FormField control={form.control} name="specialite" render={({ field }) => ( <FormItem><FormLabel>Spécialité</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="email_professionnel" render={({ field }) => ( <FormItem><FormLabel>Email Professionnel</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </>
                        )}
                        <hr className="my-4"/>
                        <FormField control={form.control} name="genre" render={({ field }) => ( <FormItem><FormLabel>Genre (Optionnel)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Non défini" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Homme">Homme</SelectItem><SelectItem value="Femme">Femme</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="telephone" render={({ field }) => ( <FormItem><FormLabel>Téléphone (Optionnel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="adresse" render={({ field }) => ( <FormItem><FormLabel>Adresse (Optionnel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="photo_url" render={({ field }) => ( <FormItem><FormLabel>URL de la photo (Optionnel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                </ScrollArea>
                <DialogFooter className='pt-4 justify-between'>
                    <div></div>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder les modifications"}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
