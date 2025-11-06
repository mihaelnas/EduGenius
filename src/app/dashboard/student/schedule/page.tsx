
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { schedule, ScheduleEvent, users, getDisplayName, AppUser, classes } from '@/lib/placeholder-data';
import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock: assumes the logged in student is Bob Williams (id: usr_3)
const STUDENT_ID = 'usr_3';

const DayColumn = ({ day, events, getTeacherName }: { day: Date; events: ScheduleEvent[]; getTeacherName: (id: string) => string; }) => {
  const dayEvents = events
    .filter(event => isSameDay(new Date(event.date), day))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex-1 space-y-4">
      <div className="text-center pb-2 border-b">
        <p className="font-semibold text-lg">{format(day, 'EEEE', { locale: fr })}</p>
        <p className="text-sm text-muted-foreground">{format(day, 'd MMMM', { locale: fr })}</p>
      </div>
      <div className="space-y-3 px-2">
        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <Card key={event.id} className="w-full">
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold">{event.subject}</p>
                <p className="text-xs text-muted-foreground">{event.startTime} - {event.endTime}</p>
                <Badge variant={event.type === 'en-ligne' ? 'secondary' : 'outline'}>
                  {event.type === 'en-ligne' ? 'En ligne' : 'En salle'}
                </Badge>
                <div className="flex items-center gap-2 text-xs pt-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{getTeacherName(event.teacherId)}</span>
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

export default function StudentSchedulePage() {
  const [week, setWeek] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const studentClasses = classes.filter(c => c.studentIds.includes(STUDENT_ID));
  const studentClassNames = studentClasses.map(c => c.name);

  const studentSchedule = schedule.filter(event => studentClassNames.includes(event.class));
  
  const getTeacherName = (id: string): string => {
    const teacher = users.find(u => u.id === id);
    return teacher ? getDisplayName(teacher) : 'N/A';
  };

  const daysOfWeek = Array.from({ length: 5 }, (_, i) => addDays(week, i));

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mon Emploi du Temps</h1>
      <p className="text-muted-foreground">Voici votre emploi du temps pour la semaine.</p>
      
      <Card className="mt-6">
          <CardHeader>
             {/* Note: Week navigation can be added here */}
            <CardTitle>Semaine du {format(week, 'd MMMM yyyy', { locale: fr })}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex divide-x rounded-lg border">
                {daysOfWeek.map(day => (
                    <DayColumn 
                        key={day.toISOString()} 
                        day={day} 
                        events={studentSchedule}
                        getTeacherName={getTeacherName}
                    />
                ))}
              </div>
          </CardContent>
      </Card>
    </>
  );
}
