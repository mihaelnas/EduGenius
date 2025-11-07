
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppUser, Class, Subject } from '@/lib/placeholder-data';
import { Users, School, Book, BarChart3, Activity } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

type AdminDashboardProps = {
    userName: string | null;
    users: AppUser[];
    classes: Class[];
    subjects: Subject[];
}

const chartConfig = {
  value: {
    label: 'Nombre',
    color: 'hsl(var(--primary))',
  },
} 

export function AdminDashboard({ userName, users, classes, subjects }: AdminDashboardProps) {

    const roleCounts = React.useMemo(() => users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<AppUser['role'], number>), [users]);

    const chartData = React.useMemo(() => [
      { name: 'Admins', value: roleCounts.admin || 0 },
      { name: 'Enseignants', value: roleCounts.teacher || 0 },
      { name: 'Étudiants', value: roleCounts.student || 0 },
    ], [roleCounts]);


    const stats = React.useMemo(() => [
        { title: "Total Utilisateurs", value: users.length, icon: <Users className="h-4 w-4 text-muted-foreground" />, description: "+2% depuis hier" },
        { title: "Total Classes", value: classes.length, icon: <School className="h-4 w-4 text-muted-foreground" />, description: "+5 depuis la semaine dernière" },
        { title: "Total Matières", value: subjects.length, icon: <Book className="h-4 w-4 text-muted-foreground" />, description: "Stable" },
        { title: "Enseignants Actifs", value: users.filter(u => u.role === 'teacher' && u.status === 'active').length, icon: <Users className="h-4 w-4 text-muted-foreground" />, description: "" },
    ], [users, classes, subjects]);

    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Bienvenue, <span className="text-primary">{userName || "Admin"}</span> !
            </h1>
            <p className="text-muted-foreground">Voici un aperçu de l'état de la plateforme.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-4 grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BarChart3 size={20} />
                            Répartition des Utilisateurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                       </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Activity size={20} />
                            Activité Récente
                        </CardTitle>
                        <CardDescription>Derniers événements sur la plateforme.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>• Nouvelle classe "Master 2 - GID" ajoutée.</p>
                            <p>• 5 nouveaux étudiants inscrits.</p>
                            <p>• Cours "Introduction à l'IA" publié.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
