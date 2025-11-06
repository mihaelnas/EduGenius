
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, User, Video } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { schedule as initialSchedule, ScheduleEvent, users, getDisplayName, AppUser } from '@/lib/placeholder-data';
import { AddEventDialog } from '@/components/teacher/add-event-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const statusVariant: { [key in ScheduleEvent['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'planifié': 'default',
  'effectué': 'secondary',
  'reporté': 'outline',
  'annulé': 'destructive',
};

export default function TeacherSchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [schedule, setSchedule] = React.useState<ScheduleEvent[]>(initialSchedule);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(new Date());
  }, []);

  const getTeacherById = (id: string): AppUser | undefined => users.find(u => u.id === id);

  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const todaysEvents = schedule.filter(event => event.date === selectedDateStr);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Emploi du temps Global</h1>
        <Button onClick={() => setIsAddEventDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Événements du jour</CardTitle>
              <CardDescription>
                Voici les cours pour le {date ? format(date, 'd MMMM yyyy', { locale: fr }) : 'jour sélectionné'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysEvents.length > 0 ? (
                  todaysEvents.map((item) => {
                    const teacher = getTeacherById(item.teacherId);
                    return (
                      <div key={item.id} className="flex items-start justify-between rounded-lg border p-4 gap-4">
                        <div className="space-y-2 flex-1">
                          <p className="font-semibold">{item.subject}</p>
                          <p className="text-sm text-muted-foreground">{item.class}</p>
                          {teacher && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{getDisplayName(teacher)}</span>
                            </div>
                          )}
                          {item.type === 'en-ligne' && item.conferenceLink && (
                            <Button asChild size="sm" className="mt-2">
                              <Link href={item.conferenceLink} target="_blank">
                                <Video className="mr-2 h-4 w-4" />
                                Rejoindre
                              </Link>
                            </Button>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="font-medium whitespace-nowrap">{item.startTime} - {item.endTime}</p>
                          <Badge variant={statusVariant[item.status]} className="capitalize">{item.status}</Badge>
                          <Badge variant={item.type === 'en-ligne' ? 'secondary' : 'outline'} className="capitalize">{item.type === 'en-ligne' ? 'En ligne' : 'En salle'}</Badge>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucun événement prévu pour cette date.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-0">
               {date ? (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  locale={fr}
                  pagedNavigation
                  disabled={(d) => d < new Date('1900-01-01')}
                />
              ) : (
                <div className="p-3">
                  <Skeleton className="h-[298px] w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AddEventDialog 
        isOpen={isAddEventDialogOpen}
        setIsOpen={setIsAddEventDialogOpen}
        onEventAdded={(newEvent) => setSchedule(prev => [...prev, newEvent])}
      />
    </>
  );
}
