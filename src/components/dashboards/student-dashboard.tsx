
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, BookCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import type { Class, Subject, Course } from '@/lib/placeholder-data';

type StudentDashboardProps = {
    userName: string | null;
    studentClass: Class | null | undefined;
    subjects: Subject[];
    recentCourses: Course[];
}

export function StudentDashboard({ userName, studentClass, subjects, recentCourses }: StudentDashboardProps) {

    const stats = [
        { title: "Matières Inscrites", value: subjects.length, icon: <BookOpen className="h-6 w-6 text-primary" />, href: "/dashboard/student/courses" },
        { title: "Camarades de classe", value: studentClass ? studentClass.studentIds.length - 1 : 0, icon: <Users className="h-6 w-6 text-primary" />, href: "/dashboard/student/classmates" },
    ];
    
    const getSubjectName = (subjectId: string) => {
        return subjects.find(s => s.id === subjectId)?.name || 'Matière inconnue';
    }

    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Bonjour, <span className="text-primary">{userName || "Étudiant"}</span> !
            </h1>
            <p className="text-muted-foreground">Prêt(e) à apprendre quelque chose de nouveau aujourd'hui ?</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                                <Link href={stat.href}>Accéder &rarr;</Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-4 grid gap-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookCheck size={20} /> Accès Rapide aux Cours
                        </CardTitle>
                        <CardDescription>Reprenez là où vous vous êtes arrêté.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentCourses.length > 0 ? (
                            <div className="space-y-4">
                                {recentCourses.map(course => (
                                    <Link key={course.id} href={`/dashboard/student/courses/${course.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{course.title}</p>
                                                <p className="text-sm text-muted-foreground">{getSubjectName(course.subjectId)}</p>
                                            </div>
                                            <Button variant="ghost" size="sm">Voir le cours</Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Aucun cours récent disponible.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
