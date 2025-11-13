
'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayName, Student, Teacher, AppUser } from '@/lib/placeholder-data';
import { AtSign, Cake, GraduationCap, Home, Mail, MapPin, Phone, School, User as UserIcon, Briefcase, Building, Camera, KeyRound, MailPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { UpdatePhotoDialog } from '@/components/update-photo-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordDialog } from '@/components/profile/change-password-dialog';
import { ChangeEmailDialog } from '@/components/profile/change-email-dialog';
import { useToast } from '@/hooks/use-toast';

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

export default function ProfileDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  
  // These would come from your auth context
  const currentUserId = '1'; // Hardcoded current user ID for demo
  const isOwnProfile = currentUserId === userId;

  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with your API call to fetch user profile
    setIsLoading(true);
    // Simulating API fetch
    setTimeout(() => {
        // Example: in a real app, you would fetch from `/api/users/${userId}`
        // For now, we'll use some dummy data.
        const dummyUser: AppUser = {
            id: userId,
            firstName: 'Jean',
            lastName: 'DUPONT',
            email: 'jean.dupont@example.com',
            username: '@jeandupont',
            role: 'student',
            status: 'active',
            createdAt: new Date().toISOString(),
            matricule: 'E123456',
            niveau: 'L3',
            filiere: 'IG',
            groupe: 1
        };
        setUser(dummyUser);
        setIsLoading(false);
    }, 1000);
  }, [userId]);


  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = React.useState(false);

  const handlePhotoUpdate = async (newPhotoUrl: string) => {
    if (user) {
        // API call to update photo
        console.log("Updating photo to:", newPhotoUrl);
        toast({
            title: 'Photo de profil mise à jour (Simulation)',
            description: 'Votre nouvelle photo a été enregistrée.'
        });
    }
  }

  if (isLoading) {
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
    return <p className="text-center text-muted-foreground">Profil non trouvé.</p>;
  }

  const student = user.role === 'student' ? user as Student : null;
  const teacher = user.role === 'teacher' ? user as Teacher : null;

  const roleName = {
    student: 'Étudiant',
    teacher: 'Enseignant',
    admin: 'Administrateur',
  }[user.role];

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.photo} alt={getDisplayName(user)} />
            <AvatarFallback className="text-3xl">
                {(user.firstName || '').charAt(0)}{(user.lastName || '').charAt(0)}
            </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
                <button 
                    onClick={() => setIsPhotoDialogOpen(true)}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Camera className="h-8 w-8 text-white" />
                </button>
            )}
        </div>
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
            <InfoRow icon={<Mail className="h-5 w-5"/>} label="Email de connexion" value={user.email} />
            <InfoRow icon={<AtSign className="h-5 w-5"/>} label="Nom d'utilisateur" value={user.username} />
            <InfoRow icon={<Phone className="h-5 w-5"/>} label="Téléphone" value={user.telephone} />
            <InfoRow icon={<Home className="h-5 w-5"/>} label="Adresse" value={user.adresse} />
            <InfoRow icon={<UserIcon className="h-5 w-5"/>} label="Genre" value={user.genre} />
        </CardContent>
        {isOwnProfile && (
            <>
                <Separator />
                <CardContent className="p-6 flex flex-col sm:flex-row gap-2">
                     <Button variant="outline" onClick={() => setIsChangeEmailOpen(true)}>
                        <MailPlus className="mr-2 h-4 w-4" />
                        Changer d'email
                    </Button>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Changer le mot de passe
                    </Button>
                </CardContent>
            </>
        )}
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
    {user && (
        <>
            <UpdatePhotoDialog 
                isOpen={isPhotoDialogOpen}
                setIsOpen={setIsPhotoDialogOpen}
                currentPhotoUrl={user.photo}
                onUpdate={handlePhotoUpdate}
            />
            {isOwnProfile && (
                <>
                 <ChangePasswordDialog 
                    isOpen={isChangePasswordOpen}
                    setIsOpen={setIsChangePasswordOpen}
                 />
                 <ChangeEmailDialog
                    isOpen={isChangeEmailOpen}
                    setIsOpen={setIsChangeEmailOpen}
                    currentEmail={user.email}
                 />
                </>
            )}
        </>
    )}
    </>
  );
}
