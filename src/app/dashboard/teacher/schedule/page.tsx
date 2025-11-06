'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { fr } from 'date-fns/locale';

const scheduleItems = [
    { time: '09:00 - 10:00', class: 'Terminale - Section A', subject: 'Mathématiques' },
    { time: '11:00 - 12:00', class: 'Terminale - Physique', subject: 'Physique' },
    { time: '14:00 - 15:00', class: 'Terminale - Section A', subject: 'Mathématiques' },
];

export default function TeacherSchedulePage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mon Emploi du temps</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Emploi du temps du jour</CardTitle>
                    <CardDescription>Voici vos cours pour aujourd'hui, 25 Avril 2024.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {scheduleItems.map((item, index) => (
                             <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-semibold">{item.subject}</p>
                                    <p className="text-sm text-muted-foreground">{item.class}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{item.time}</p>
                                </div>
                            </div>
                        ))}
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
    </>
  );
}
