
'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayName, Student, Teacher } from '@/lib/placeholder-data';
import { AtSign, Cake, GraduationCap, Home, Mail, MapPin, Phone, School, User as UserIcon, Briefcase, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { AppUser } from '@/lib/placeholder-data';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-primary mt-1">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: user, isLoading: isProfileLoading } = useDoc<AppUser>(userDocRef);

  const loading = isUserLoading || isProfileLoading;

  if (loading) {
    return (
        <>
            <div className="flex items-center space-x-4 mb-8">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </>
    );
  }

  if (!user) {
    return <p>Utilisateur non trouvé.</p>;
  }

  const student = user.role === 'student' ? user as Student : null;
  const teacher = user.role === 'teacher' ? user as Teacher : null;

  const roleName = {
    student: 'Étudiant',
    teacher: 'Enseignant',
    admin: 'Administrateur',
  }[user.role];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={user.photo} alt={getDisplayName(user)} />
          <AvatarFallback className="text-3xl">
            {user.prenom.charAt(0)}{user.nom.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold font-headline">{getDisplayName(user)}</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge>{roleName}</Badge>
             <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-600' : 'bg-gray-400'}>
                {user.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UserIcon/> Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoRow icon={<Mail className="h-5 w-5"/>} label="Email" value={user.email} />
            <InfoRow icon={<AtSign className="h-5 w-5"/>} label="Nom d'utilisateur" value={user.username} />
            <InfoRow icon={<Phone className="h-5 w-5"/>} label="Téléphone" value={user.telephone} />
            <InfoRow icon={<Home className="h-5 w-5"/>} label="Adresse" value={user.adresse} />
            <InfoRow icon={<UserIcon className="h-5 w-5"/>} label="Genre" value={user.genre} />
        </CardContent>
      </Card>

      {student && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><GraduationCap/> Informations Académiques</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow icon={<UserIcon className="h-5 w-5"/>} label="Matricule" value={student.matricule} />
                <InfoRow icon={<Cake className="h-5 w-5"/>} label="Date de Naissance" value={student.dateDeNaissance} />
                <InfoRow icon={<MapPin className="h-5 w-5"/>} label="Lieu de Naissance" value={student.lieuDeNaissance} />
                <InfoRow icon={<School className="h-5 w-5"/>} label="Filière" value={student.filiere} />
                <InfoRow icon={<Building className="h-5 w-5"/>} label="Niveau" value={student.niveau} />
            </CardContent>
        </Card>
      )}

      {teacher && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Briefcase/> Informations Professionnelles</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow icon={<Mail className="h-5 w-5"/>} label="Email Professionnel" value={teacher.emailPro} />
                <InfoRow icon={<GraduationCap className="h-5 w-5"/>} label="Spécialité" value={teacher.specialite} />
            </CardContent>
        </Card>
      )}

    </div>
  );
}
