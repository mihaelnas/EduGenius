'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ScheduleEvent, Class, Subject, getDisplayName } from '@/lib/placeholder-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUser } from '@/firebase';

const formSchema = z.object({
  date: z.string().min(1, 'La date est requise.'),
  startTime: z.string().min(1, 'L\'heure de début est requise.'),
  endTime: z.string().min(1, 'L\'heure de fin est requise.'),
  subject: z.string().min(1, 'La matière est requise.'),
  class: z.string().min(1, 'La classe est requise.'),
  type: z.enum(['en-salle', 'en-ligne']),
  status: z.enum(['planifié', 'reporté', 'annulé', 'effectué']),
  conferenceLink: z.string().url({ message: "Veuillez entrer une URL valide." }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type AddEventDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onEventAdded: (newEvent: FormValues) => void;
    teacherClasses: Class[];
    teacherSubjects: Subject[];
}

export function AddEventDialog({ isOpen, setIsOpen, onEventAdded, teacherClasses, teacherSubjects }: AddEventDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: '',
      startTime: '',
      endTime: '',
      subject: '',
      class: '',
      type: 'en-salle',
      status: 'planifié',
      conferenceLink: '',
    },
  });

  const eventType = form.watch('type');

  function onSubmit(values: FormValues) {
    onEventAdded(values);
    toast({
      title: 'Événement ajouté',
      description: `Le cours de ${values.subject} a été ajouté à l'emploi du temps.`,
    });
    setIsOpen(false);
    form.reset();
  }
  
  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
          form.reset({
            date: '',
            startTime: '',
            endTime: '',
            subject: '',
            class: '',
            type: 'en-salle',
            status: 'planifié',
            conferenceLink: ''
          });
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teacherSubjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teacherClasses.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
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
                        <Input value={getDisplayName({firstName: user.displayName || '', lastName: ''}) || user.email || ''} disabled />
                    </FormControl>
                </FormItem>
            )}
            
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="en-salle">En salle</SelectItem><SelectItem value="en-ligne">En ligne</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="planifié">Planifié</SelectItem><SelectItem value="effectué">Effectué</SelectItem><SelectItem value="reporté">Reporté</SelectItem><SelectItem value="annulé">Annulé</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit">Ajouter l'événement</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
