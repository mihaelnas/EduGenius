
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleEvent, getDisplayName, AppUser, Class } from '@/lib/placeholder-data';
import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DayColumn = ({ day, events, getTeacherName }: { day: Date; events: ScheduleEvent[]; getTeacherName: (id: number) => string; }) => {
  const dayEvents = events
    .filter(event => isSameDay(new Date(event.date), day))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex-1 space-y-4">
      <div className="text-center pb-2 border-b">
        <p className="font-semibold text-lg capitalize">{format(day, 'EEEE', { locale: fr })}</p>
        <p className="text-sm text-muted-foreground">{format(day, 'd MMMM', { locale: fr })}</p>
      </div>
      <div className="space-y-3 px-2 min-h-[100px]">
        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <Card key={event.id_evenement} className="w-full">
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold">{event.subject}</p>
                <p className="text-xs text-muted-foreground">{event.startTime} - {event.endTime}</p>
                <Badge variant={event.type === 'en-ligne' ? 'secondary' : 'outline'}>
                  {event.type === 'en-ligne' ? 'En ligne' : 'En salle'}
                </Badge>
                <div className="flex items-center gap-2 text-xs pt-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{getTeacherName(event.id_enseignant)}</span>
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
  const { user } = useAuth();
  const { toast } = useToast();

  const [week, setWeek] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [studentSchedule, setStudentSchedule] = React.useState<ScheduleEvent[]>([]);
  const [allTeachers, setAllTeachers] = React.useState<AppUser[]>([]);
  const [studentClass, setStudentClass] = React.useState<Class | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    
    const fetchScheduleData = async () => {
      setIsLoading(true);
      try {
        // La nouvelle route GET /etudiant/{id} ne fait plus partie du préfixe /planning
        const [scheduleData, teachersData, classData] = await Promise.all([
           apiFetch(`/etudiant/${user.id}`).catch(() => []),
           apiFetch('/admin/professeurs').catch(() => []),
           apiFetch(`/etudiant/${user.id}/classe`).catch(() => null),
        ]);

        setStudentSchedule(scheduleData || []);
        setAllTeachers(teachersData || []);
        setStudentClass(classData);

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur de chargement',
          description: "Impossible de récupérer les données de l'emploi du temps.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchScheduleData();
  }, [user, toast]);
  

  const getTeacherName = (id: number): string => {
    if (!allTeachers) return 'Chargement...';
    const teacher = allTeachers.find(u => u.id === id);
    return teacher ? getDisplayName(teacher) : 'N/A';
  };

  const daysOfWeek = Array.from({ length: 5 }, (_, i) => addDays(week, i));

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mon Emploi du Temps</h1>
      <p className="text-muted-foreground">Voici votre emploi du temps pour la semaine.</p>
      
      <Card className="mt-6">
          <CardHeader>
            <CardTitle>Semaine du {format(week, 'd MMMM yyyy', { locale: fr })}</CardTitle>
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
                        events={studentSchedule || []}
                        getTeacherName={getTeacherName}
                    />
                ))}
              </div>
             )}
              {!isLoading && !studentClass && (
                 <div className="text-center py-10 text-muted-foreground">
                    <p>Vous n'êtes inscrit(e) dans aucune classe pour le moment.</p>
                 </div>
              )}
          </CardContent>
      </Card>
    </>
  );
}
