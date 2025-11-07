
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Class, Subject, ScheduleEvent } from '@/lib/placeholder-data';
import { School, BookOpen, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TeacherDashboardProps = {
    userName: string | null;
    classes: Class[];
    subjects: Subject[];
    schedule: ScheduleEvent[];
}

export function TeacherDashboard({ userName, classes, subjects, schedule }: TeacherDashboardProps) {
    const todaysDateStr = format(new Date(), 'yyyy-MM-dd');
    const upcomingEvents = schedule
        .filter(event => event.date >= todaysDateStr && event.status === 'planifié')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime))
        .slice(0, 3);

    const stats = [
        { title: "Mes Classes", value: classes.length, icon: <School className="h-6 w-6 text-primary" />, href: "/dashboard/teacher/classes" },
        { title: "Mes Matières", value: subjects.length, icon: <BookOpen className="h-6 w-6 text-primary" />, href: "/dashboard/teacher/courses" },
        { title: "Événements à venir", value: upcomingEvents.length, icon: <Calendar className="h-6 w-6 text-primary" />, href: "/dashboard/teacher/schedule" },
    ];

    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Bienvenue, <span className="text-primary">{userName || "Enseignant"}</span> !
            </h1>
            <p className="text-muted-foreground">Votre espace de travail pour gérer cours et classes.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg font-headline">{stat.title}</CardTitle>
                                {stat.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{stat.value}</p>
                        </CardContent>
                         <div className="p-6 pt-0">
                            <Button asChild variant="link" className="p-0 h-auto">
                                <Link href={stat.href}>Voir les détails &rarr;</Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-4 grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Clock size={20} /> Prochains Cours
                        </CardTitle>
                        <CardDescription>Vos prochains événements planifiés.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingEvents.map(event => (
                                    <div key={event.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                                        <div>
                                            <p className="font-semibold">{event.subject}</p>
                                            <p className="text-sm text-muted-foreground">{event.class}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-medium">
                                                {format(new Date(event.date), 'EEEE d MMMM', { locale: fr })}
                                            </p>
                                            <Badge variant="secondary">{event.startTime} - {event.endTime}</Badge>
                                            <Badge variant={event.type === 'en-ligne' ? 'default' : 'outline'} className="capitalize">
                                                {event.type}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Aucun événement à venir.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
