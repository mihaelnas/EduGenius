
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const resourceSchema = z.object({
  id: z.string().optional(),
  type_resource: z.enum(['pdf', 'video', 'link']),
  titre: z.string().min(1, 'Le titre est requis.'),
  url: z.string().url("Veuillez fournir une URL valide.").or(z.literal('')),
});

const formSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis.'),
  contenu: z.string().min(1, 'Le contenu est requis.'),
  // resources: z.array(resourceSchema), // La gestion des ressources sera gérée séparément
});

export type AddCourseFormValues = z.infer<typeof formSchema>;

type AddCourseDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onCourseAdded: (values: AddCourseFormValues) => Promise<void>;
    subjectName: string;
}

export function AddCourseDialog({ isOpen, setIsOpen, onCourseAdded, subjectName }: AddCourseDialogProps) {

  const form = useForm<AddCourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titre: '',
      contenu: '',
      // resources: [],
    },
  });

  // const { fields, append, remove } = useFieldArray({
  //   control: form.control,
  //   name: "resources"
  // });
  
  async function onSubmit(values: AddCourseFormValues) {
    await onCourseAdded(values);
    setIsOpen(false);
  }
  
   const handleOpenChange = (open: boolean) => {
    if (form.formState.isSubmitting) return;
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau cours</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un nouveau cours pour la matière "{subjectName}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="titre" render={({ field }) => ( <FormItem><FormLabel>Titre du cours</FormLabel><FormControl><Input placeholder="Ex: Introduction à l'Algèbre" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contenu" render={({ field }) => ( <FormItem><FormLabel>Contenu / Description</FormLabel><FormControl><Textarea placeholder="Décrivez le contenu de ce cours..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            {/* <div>
              <h4 className="text-sm font-medium mb-2">Ressources</h4>
              <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end p-3 border rounded-md">
                      <FormField control={form.control} name={`resources.${index}.type`} render={({ field }) => ( <FormItem className="w-32"><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Vidéo</SelectItem><SelectItem value="link">Lien</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name={`resources.${index}.title`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Titre</FormLabel><FormControl><Input placeholder="Titre de la ressource" {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name={`resources.${index}.url`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'link', title: '', url: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ressource
                </Button>
              </div>
            </div> */}

            <DialogFooter className='pt-4'>
               <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={form.formState.isSubmitting}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Création...' : 'Créer le cours'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
