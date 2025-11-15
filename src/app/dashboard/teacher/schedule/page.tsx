
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, User, Video, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, isSameDay, startOfWeek, addDays, subDays, endOfWeek } from 'date-fns';
import { ScheduleEvent, getDisplayName, AppUser, Class, Subject } from '@/lib/placeholder-data';
import { AddEventDialog } from '@/components/teacher/add-event-dialog';
import { EditEventDialog } from '@/components/teacher/edit-event-dialog';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

const statusVariant: { [key in ScheduleEvent['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'planifié': 'default',
  'effectué': 'secondary',
  'reporté': 'outline',
  'annulé': 'destructive',
};

const DayColumn = ({ day, events, onEdit, onDelete }: { day: Date; events: ScheduleEvent[]; onEdit: (event: ScheduleEvent) => void; onDelete: (event: ScheduleEvent) => void; }) => {
  const dayEvents = events
    .filter(event => isSameDay(new Date(event.date), day))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex-1 space-y-4">
      <div className="text-center pb-2 border-b">
        <p className="font-semibold text-lg capitalize">{format(day, 'EEEE', { locale: fr })}</p>
        <p className="text-sm text-muted-foreground">{format(day, 'd MMMM', { locale: fr })}</p>
      </div>
      <div className="space-y-3 px-2 min-h-[200px]">
        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <Card key={event.id_evenement} className="w-full shadow-sm hover:shadow-md transition-shadow">
               <CardContent className="p-3 space-y-2 relative">
                <div className="absolute top-1 right-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEdit(event)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="font-semibold pr-6">{event.subject}</p>
                <p className="text-xs text-muted-foreground">{event.startTime} - {event.endTime}</p>
                <div className='flex flex-wrap gap-1'>
                    <Badge variant={event.type === 'en-ligne' ? 'secondary' : 'outline'} className="capitalize">{event.type === 'en-ligne' ? 'En ligne' : 'En salle'}</Badge>
                    <Badge variant={statusVariant[event.status]} className="capitalize">{event.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs pt-1 text-muted-foreground">
                    <span>{event.class_name}</span>
                </div>
                {event.type === 'en-ligne' && event.conferenceLink && (
                    <Button asChild size="sm" className="w-full mt-2">
                      <Link href={event.conferenceLink} target="_blank">
                        <Video className="mr-2 h-4 w-4" />
                        Rejoindre
                      </Link>
                    </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center pt-4">Aucun cours</p>
        )}
      </div>
    </div>
  );
};

export default function TeacherSchedulePage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const [week, setWeek] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const [schedule, setSchedule] = React.useState<ScheduleEvent[]>([]);
  const [teacherClasses, setTeacherClasses] = React.useState<Class[]>([]);
  const [teacherSubjects, setTeacherSubjects] = React.useState<Subject[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);

  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = React.useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<ScheduleEvent | null>(null);

  const { toast } = useToast();

  const fetchSchedule = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const start = format(startOfWeek(week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(week, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [scheduleData, classesData, subjectsData] = await Promise.all([
        apiFetch(`/enseignant/planning?start_date=${start}&end_date=${end}`).catch(() => []),
        apiFetch(`/enseignant/${user.id}/classes`).catch(() => []),
        apiFetch(`/enseignant/${user.id}/matieres`).catch(() => [])
      ]);
      setSchedule(scheduleData || []);
      setTeacherClasses(classesData || []);
      setTeacherSubjects(subjectsData || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le planning.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, week, toast]);

  React.useEffect(() => {
    if (!isUserLoading && user) {
        fetchSchedule();
    }
  }, [isUserLoading, user, fetchSchedule]);


  const handleEventAdded = async (newEventData: Omit<ScheduleEvent, 'id_evenement' | 'id_enseignant'>) => {
    try {
        await apiFetch('/enseignant/planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEventData),
        });
        toast({ title: 'Événement ajouté avec succès.' });
        fetchSchedule();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };
  
  const handleEventUpdated = async (updatedEventData: ScheduleEvent) => {
    try {
        await apiFetch(`/enseignant/planning/${updatedEventData.id_evenement}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEventData),
        });
        toast({ title: 'Événement mis à jour avec succès.' });
        fetchSchedule();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
  };

  const handleOpenEdit = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEditEventDialogOpen(true);
  };

  const handleOpenDelete = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    try {
        await apiFetch(`/enseignant/planning/${selectedEvent.id_evenement}`, { method: 'DELETE' });
        toast({ variant: 'destructive', title: 'Événement supprimé.' });
        fetchSchedule();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    }
    setIsDeleteDialogOpen(false);
    setSelectedEvent(null);
  };

  const daysOfWeek = Array.from({ length: 5 }, (_, i) => addDays(week, i));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Mon Emploi du Temps</h1>
          <p className="text-muted-foreground">Gérez votre planning hebdomadaire.</p>
        </div>
        <Button onClick={() => setIsAddEventDialogOpen(true)} disabled={isUserLoading || isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Semaine du {format(week, 'd MMMM yyyy', { locale: fr })}</CardTitle>
          <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeek(subDays(week, 7))}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setWeek(addDays(week, 7))}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
              <div className="flex divide-x rounded-lg border">
                  {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className="flex-1 space-y-4">
                           <div className="text-center pb-2 border-b p-2">
                              <Skeleton className="h-6 w-24 mx-auto" />
                              <Skeleton className="h-4 w-20 mx-auto mt-1" />
                           </div>
                           <div className="p-2 space-y-3">
                              <Skeleton className="h-28 w-full" />
                           </div>
                      </div>
                  ))}
              </div>
           ) : (
            <div className="flex divide-x rounded-lg border bg-muted/20">
              {daysOfWeek.map(day => (
                  <DayColumn 
                      key={day.toISOString()} 
                      day={day} 
                      events={schedule}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                  />
              ))}
            </div>
           )}
        </CardContent>
      </Card>

      <AddEventDialog 
        isOpen={isAddEventDialogOpen}
        setIsOpen={setIsAddEventDialogOpen}
        onEventAdded={handleEventAdded}
        teacherClasses={teacherClasses}
        teacherSubjects={teacherSubjects}
      />
      {selectedEvent && (
        <EditEventDialog
          isOpen={isEditEventDialogOpen}
          setIsOpen={setIsEditEventDialogOpen}
          onEventUpdated={handleEventUpdated}
          eventData={selectedEvent}
          teacherClasses={teacherClasses}
          teacherSubjects={teacherSubjects}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedEvent ? `le cours de ${selectedEvent.subject}` : 'l\'événement'}
        itemType="cet événement"
      />
    </>
  );
}
