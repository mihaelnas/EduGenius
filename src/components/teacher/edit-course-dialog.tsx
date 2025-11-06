
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Course } from '@/lib/placeholder-data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const resourceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['pdf', 'video', 'link']),
  title: z.string().min(1, 'Le titre est requis.'),
  url: z.string().url('URL invalide.'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  content: z.string().min(1, 'Le contenu est requis.'),
  resources: z.array(resourceSchema),
});

type EditCourseDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    course: Course;
    onCourseUpdated: (updatedCourse: Course) => void;
}

export function EditCourseDialog({ isOpen, setIsOpen, course, onCourseUpdated }: EditCourseDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: course.title,
        content: course.content,
        resources: course.resources
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "resources"
  });
  
  React.useEffect(() => {
    form.reset(course);
  }, [course, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedCourse: Course = {
      ...course,
      ...values,
      resources: values.resources.map(r => ({ ...r, id: r.id || `res_${Date.now()}_${Math.random()}`}))
    };
    onCourseUpdated(updatedCourse);
    toast({
      title: 'Cours modifié',
      description: `Le cours "${values.title}" a été mis à jour.`,
    });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le cours</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du cours ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Titre du cours</FormLabel><FormControl><Input placeholder="Ex: Introduction à l'Algèbre" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Contenu / Description</FormLabel><FormControl><Textarea placeholder="Décrivez le contenu de ce cours..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Ressources</h4>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end p-3 border rounded-md">
                     <FormField control={form.control} name={`resources.${index}.type`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Vidéo</SelectItem><SelectItem value="link">Lien</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`resources.${index}.title`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Titre</FormLabel><FormControl><Input placeholder="Titre de la ressource" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name={`resources.${index}.url`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `new_${Date.now()}`, type: 'link', title: '', url: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ressource
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit">Sauvegarder les modifications</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
