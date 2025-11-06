'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { schedule as initialSchedule, ScheduleEvent } from '@/lib/placeholder-data';
import { AddEventDialog } from '@/components/teacher/add-event-dialog';
import { Badge } from '@/components/ui/badge';

const statusVariant: { [key in ScheduleEvent['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'planifié': 'default',
  'effectué': 'secondary',
  'reporté': 'outline',
  'annulé': 'destructive',
};

export default function TeacherSchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [schedule, setSchedule] = React.useState<ScheduleEvent[]>(initialSchedule);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = React.useState(false);

  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const todaysEvents = schedule.filter(event => event.date === selectedDateStr);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mon Emploi du temps</h1>
        <Button onClick={() => setIsAddEventDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Emploi du temps du jour</CardTitle>
              <CardDescription>
                Voici vos cours pour le {date ? format(date, 'd MMMM yyyy', { locale: fr }) : 'jour sélectionné'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysEvents.length > 0 ? (
                  todaysEvents.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-semibold">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.class}</p>
                        <p className="text-xs text-muted-foreground">{item.type === 'en-ligne' ? 'En ligne' : 'En salle'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-medium">{item.startTime} - {item.endTime}</p>
                        <Badge variant={statusVariant[item.status]} className="capitalize">{item.status}</Badge>
                      </div>
                    </div>
                  ))
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
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
                locale={fr}
              />
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
