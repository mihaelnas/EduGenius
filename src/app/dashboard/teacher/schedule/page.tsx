
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, User, Video } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { ScheduleEvent, getDisplayName, AppUser, Class, Subject } from '@/lib/placeholder-data';
import { AddEventDialog } from '@/components/teacher/add-event-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc } from 'firebase/firestore';

const statusVariant: { [key in ScheduleEvent['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'planifié': 'default',
  'effectué': 'secondary',
  'reporté': 'outline',
  'annulé': 'destructive',
};

export default function TeacherSchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = React.useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const scheduleQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'schedule'), where('teacherId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: schedule, isLoading: isLoadingSchedule } = useCollection<ScheduleEvent>(scheduleQuery);
  
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersCollectionRef);

  const teacherClassesQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'classes'), where('teacherIds', 'array-contains', user.uid)) : null,
    [user, firestore]
  );
  const { data: teacherClasses, isLoading: isLoadingClasses } = useCollection<Class>(teacherClassesQuery);

  const teacherSubjectsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'subjects'), where('teacherId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(teacherSubjectsQuery);

  const getTeacherById = (id: string): AppUser | undefined => users?.find(u => u.id === id);

  const todaysEvents = React.useMemo(() => {
    if (!date || !schedule) return [];
    return schedule
      .filter(event => {
        // Use isSameDay to correctly compare dates ignoring timezones.
        // new Date(event.date) handles cases where date is a string 'YYYY-MM-DD'
        // or a full ISO string.
        return isSameDay(new Date(event.date), date);
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedule, date]);
  
  const handleEventAdded = async (newEventData: Omit<ScheduleEvent, 'id' | 'teacherId'>) => {
    if (!user) return;
    const scheduleCollectionRef = collection(firestore, 'schedule');
    const newEvent = {
      ...newEventData,
      teacherId: user.uid,
    };
    await addDoc(scheduleCollectionRef, newEvent);
  };

  const isLoading = isLoadingSchedule || isLoadingUsers || isLoadingClasses || isLoadingSubjects;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setIsAddEventDialogOpen(true);
    }
  };
  
  const openDialogWithoutDate = () => {
    setDate(undefined); // Clear date to ensure form is fresh
    setIsAddEventDialogOpen(true);
  }


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Emploi du temps Global</h1>
        <Button onClick={openDialogWithoutDate}>
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
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : todaysEvents.length > 0 ? (
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
               <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  className="rounded-md"
                  locale={fr}
                  defaultMonth={date || new Date()}
                />
            </CardContent>
          </Card>
        </div>
      </div>
      <AddEventDialog 
        isOpen={isAddEventDialogOpen}
        setIsOpen={setIsAddEventDialogOpen}
        onEventAdded={handleEventAdded}
        teacherClasses={teacherClasses || []}
        teacherSubjects={teacherSubjects || []}
        selectedDate={date}
      />
    </>
  );
}
