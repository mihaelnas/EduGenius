
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppUser, Class, Subject, getDisplayName } from '@/lib/placeholder-data';
import { Users, School, Book, BarChart3, Activity, UserPlus, FolderPlus, BookPlus } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type AdminDashboardProps = {
    userName: string | null;
    users: AppUser[];
    classes: Class[];
    subjects: Subject[];
}

type ActivityItem = {
    type: 'user' | 'class' | 'subject';
    data: AppUser | Class | Subject;
    createdAt: Date;
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
      { name: 'Enseignants', value: roleCounts.enseignant || 0 },
      { name: 'Étudiants', value: roleCounts.etudiant || 0 },
    ], [roleCounts]);


    const stats = React.useMemo(() => [
        { title: "Total Utilisateurs", value: users.length, icon: <Users className="h-4 w-4 text-muted-foreground" />, description: "+2% depuis hier" },
        { title: "Total Classes", value: classes.length, icon: <School className="h-4 w-4 text-muted-foreground" />, description: "+5 depuis la semaine dernière" },
        { title: "Total Matières", value: subjects.length, icon: <Book className="h-4 w-4 text-muted-foreground" />, description: "Stable" },
        { title: "Enseignants Actifs", value: users.filter(u => u.role === 'enseignant' && u.statut === 'actif').length, icon: <Users className="h-4 w-4 text-muted-foreground" />, description: "" },
    ], [users, classes, subjects]);

    const recentActivity = React.useMemo(() => {
        const allActivity: ActivityItem[] = [
            ...users.map(u => ({ type: 'user' as const, data: u, createdAt: new Date(u.cree_a) })),
            ...classes.map(c => ({ type: 'class' as const, data: c, createdAt: new Date() })), // Note: Class schema has no 'cree_a'
            ...subjects.map(s => ({ type: 'subject' as const, data: s, createdAt: new Date() })) // Note: Subject schema has no 'cree_a'
        ];
        
        return allActivity
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5);
    }, [users, classes, subjects]);

    const ActivityIcon = ({ type }: { type: ActivityItem['type']}) => {
        switch(type) {
            case 'user': return <UserPlus className="h-5 w-5 text-primary" />;
            case 'class': return <FolderPlus className="h-5 w-5 text-primary" />;
            case 'subject': return <BookPlus className="h-5 w-5 text-primary" />;
            default: return <Activity className="h-5 w-5 text-primary" />;
        }
    }
    
    const getActivityTitle = (item: ActivityItem) => {
        if(item.type === 'user') return `Nouvel utilisateur : ${getDisplayName(item.data as AppUser)}`;
        if(item.type === 'class') return `Nouvelle classe : ${(item.data as Class).nom_classe}`;
        if(item.type === 'subject') return `Nouvelle matière : ${(item.data as Subject).nom_matiere}`;
        return 'Activité inconnue';
    }
    
    const getActivityId = (item: ActivityItem) => {
        if(item.type === 'user') return (item.data as AppUser).id;
        if(item.type === 'class') return (item.data as Class).id_classe;
        if(item.type === 'subject') return (item.data as Subject).id_matiere;
        return Math.random();
    }


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
                        {/* <p className="text-xs text-muted-foreground">{stat.description}</p> */}
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
                       <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
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
                       <div className="space-y-4">
                            {recentActivity.map((item) => (
                                <div key={`${item.type}-${getActivityId(item)}`} className="flex items-start gap-4">
                                    <ActivityIcon type={item.type} />
                                    <div className="text-sm">
                                        <p className="text-foreground">
                                           {getActivityTitle(item)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                           {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: fr })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                             {recentActivity.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">Aucune activité récente.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
