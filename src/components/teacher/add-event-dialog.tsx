
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ScheduleEvent, Class, Subject, getDisplayName } from '@/lib/placeholder-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

const formSchema = z.object({
  date: z.string().min(1, 'La date est requise.'),
  startTime: z.string().min(1, 'L\'heure de début est requise.'),
  endTime: z.string().min(1, 'L\'heure de fin est requise.'),
  subject: z.string().min(1, 'La matière est requise.'),
  class_name: z.string().min(1, 'La classe est requise.'),
  type: z.enum(['en-salle', 'en-ligne']),
  status: z.enum(['planifié', 'reporté', 'annulé', 'effectué']),
  conferenceLink: z.string().url({ message: "Veuillez entrer une URL valide." }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const defaultFormValues: FormValues = {
  date: '',
  startTime: '',
  endTime: '',
  subject: '',
  class_name: '',
  type: 'en-salle',
  status: 'planifié',
  conferenceLink: '',
};

type AddEventDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onEventAdded: (newEvent: FormValues) => Promise<void>;
    teacherClasses: Class[];
    teacherSubjects: Subject[];
    selectedDate?: Date;
}

export function AddEventDialog({ isOpen, setIsOpen, onEventAdded, teacherClasses, teacherSubjects, selectedDate }: AddEventDialogProps) {
  
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const eventType = form.watch('type');

  React.useEffect(() => {
    if (isOpen) {
        if (selectedDate) {
            form.reset({
                ...defaultFormValues,
                date: format(selectedDate, 'yyyy-MM-dd')
            });
        } else {
            form.reset(defaultFormValues);
        }
    }
  }, [selectedDate, isOpen, form]);

  async function onSubmit(values: FormValues) {
    await onEventAdded(values);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un événement</DialogTitle>
          <DialogDescription>
            Planifiez un nouveau cours ou événement dans votre emploi du temps.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem><FormLabel>Heure de début</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem><FormLabel>Heure de fin</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matière</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teacherSubjects.map(subject => (
                        <SelectItem key={subject.id_matiere} value={subject.nom_matiere}>{subject.nom_matiere}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="class_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teacherClasses.map(c => (
                        <SelectItem key={c.id_classe} value={c.nom_classe}>{c.nom_classe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {user && (
                <FormItem>
                    <FormLabel>Enseignant</FormLabel>
                    <FormControl>
                        <Input value={getDisplayName(user) || user.email} disabled />
                    </FormControl>
                </FormItem>
            )}
            
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="en-salle">En salle</SelectItem><SelectItem value="en-ligne">En ligne</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="planifié">Planifié</SelectItem><SelectItem value="effectué">Effectué</SelectItem><SelectItem value="reporté">Reporté</SelectItem><SelectItem value="annulé">Annulé</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
            </div>
             {eventType === 'en-ligne' && (
              <FormField
                control={form.control}
                name="conferenceLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien de la visioconférence</FormLabel>
                    <FormControl>
                      <Input placeholder="https://meet.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={form.formState.isSubmitting}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Ajout..." : "Ajouter l'événement"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
