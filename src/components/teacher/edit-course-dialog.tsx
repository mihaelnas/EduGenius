
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
  url: z.any().refine(val => {
    if (typeof val === 'string') return val.length > 0;
    if (typeof window !== 'undefined' && val instanceof FileList) return val.length > 0;
    return false;
  }, {
    message: 'Un fichier ou une URL est requis(e).',
  }),
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
    // defaultValues will be set by form.reset in useEffect
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "resources"
  });

  const watchedResources = form.watch('resources');
  
  React.useEffect(() => {
    if (course) {
      form.reset({
        ...course,
        resources: course.resources.map(r => ({ ...r, url: r.url })) // Use URL directly
      });
    }
  }, [course, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedCourse: Course = {
      ...course,
      title: values.title,
      content: values.content,
      resources: values.resources.map((r, i) => {
        let newUrl = r.url;
        // In a real app, you'd handle file uploads and get a URL.
        if (typeof newUrl === 'object' && newUrl instanceof FileList && newUrl.length > 0) {
            newUrl = newUrl[0].name; // Use new file name for demo
        }
        
        return { 
            id: r.id || `res_${Date.now()}_${Math.random()}`,
            type: r.type,
            title: r.title,
            url: newUrl,
        }
      })
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
                {fields.map((field, index) => {
                  const resourceType = watchedResources?.[index]?.type;
                  const currentUrl = course.resources[index]?.url;
                  return(
                    <div key={field.id} className="flex gap-2 items-end p-3 border rounded-md">
                      <FormField control={form.control} name={`resources.${index}.type`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Vidéo</SelectItem><SelectItem value="link">Lien</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name={`resources.${index}.title`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Titre</FormLabel><FormControl><Input placeholder="Titre de la ressource" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name={`resources.${index}.url`} render={() => (
                        <FormItem className="flex-1">
                          <FormLabel>{resourceType === 'link' || resourceType === 'video' ? 'URL' : 'Fichier'}</FormLabel>
                          <FormControl>
                            {resourceType === 'link' || resourceType === 'video' ? (
                                <Input placeholder="https://..." {...form.register(`resources.${index}.url`)} defaultValue={currentUrl} />
                            ) : (
                                <div>
                                    <Input type="file" {...form.register(`resources.${index}.url`)} />
                                    {currentUrl && <p className="text-xs text-muted-foreground mt-1">Actuel: {currentUrl.split('/').pop()}</p>}
                                </div>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `new_${Date.now()}`, type: 'link', title: '', url: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ressource
                </Button>
              </div>
            </div>

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
