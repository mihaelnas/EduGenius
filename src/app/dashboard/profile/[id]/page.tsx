
'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayName, AppUser, EtudiantDetail, EnseignantDetail } from '@/lib/placeholder-data';
import { AtSign, Cake, GraduationCap, Home, Mail, MapPin, Phone, School, User as UserIcon, Briefcase, Building, Camera, KeyRound, MailPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { UpdatePhotoDialog } from '@/components/update-photo-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordDialog } from '@/components/profile/change-password-dialog';
import { ChangeEmailDialog } from '@/components/profile/change-email-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type UserProfile = AppUser & Partial<EtudiantDetail> & Partial<EnseignantDetail>;


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
  
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id.toString() === userId;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return;
      setIsLoading(true);

      try {
        // Optimisation : on tente de fetch un étudiant, si ça échoue, on tente de fetch un prof.
        let userData;
        try {
          // Essayer de récupérer comme un étudiant
          userData = await apiFetch(`/admin/etudiant/${userId}`);
          userData.role = 'etudiant';
        } catch (error: any) {
          if (error.message && error.message.includes('404')) {
            // Si 404, ce n'est pas un étudiant, on essaie comme enseignant
            userData = await apiFetch(`/admin/professeur/${userId}`);
            userData.role = 'enseignant';
          } else {
            // Une autre erreur est survenue
            throw error;
          }
        }
        setUser(userData);

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: error.message || "Impossible de récupérer les informations de l'utilisateur."
        });
        setUser(null); // Force l'affichage du message "non trouvé"
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [userId, toast]);


  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = React.useState(false);

  const handlePhotoUpdate = async (newPhotoUrl: string) => {
    if (user) {
        // TODO: API call to update photo
        // This should be part of the general user update endpoint
        console.log("Updating photo to:", newPhotoUrl);
        toast({
            title: 'Photo de profil mise à jour (Simulation)',
            description: 'Votre nouvelle photo a été enregistrée.'
        });
    }
  }

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto">
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
        </div>
    );
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">Profil non trouvé.</p>;
  }
  
  const roleName = {
    etudiant: 'Étudiant',
    enseignant: 'Enseignant',
    admin: 'Administrateur',
  }[user.role];

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.photo_url} alt={getDisplayName(user)} />
            <AvatarFallback className="text-3xl">
                {(user.prenom || '').charAt(0)}{(user.nom || '').charAt(0)}
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
             {user.statut && (
                <Badge variant={user.statut === 'actif' ? 'default' : 'secondary'} className={user.statut === 'actif' ? 'bg-green-600' : 'bg-gray-400'}>
                    {user.statut === 'actif' ? 'Actif' : 'Inactif'}
                </Badge>
             )}
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UserIcon/> Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoRow icon={<Mail className="h-5 w-5"/>} label="Email de connexion" value={user.email} />
            <InfoRow icon={<AtSign className="h-5 w-5"/>} label="Nom d'utilisateur" value={user.nom_utilisateur} />
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

      {user.role === 'etudiant' && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><GraduationCap/> Informations Académiques</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow icon={<UserIcon className="h-5 w-5"/>} label="Matricule" value={user.matricule} />
                <InfoRow icon={<Cake className="h-5 w-5"/>} label="Date de Naissance" value={user.date_naissance ? format(new Date(user.date_naissance), 'd MMMM yyyy', { locale: fr }) : undefined} />
                <InfoRow icon={<MapPin className="h-5 w-5"/>} label="Lieu de Naissance" value={user.lieu_naissance} />
                <InfoRow icon={<School className="h-5 w-5"/>} label="Filière" value={user.filiere} />
                <InfoRow icon={<Building className="h-5 w-5"/>} label="Niveau" value={(user as EtudiantDetail).niveau_etude} />
            </CardContent>
        </Card>
      )}

      {user.role === 'enseignant' && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Briefcase/> Informations Professionnelles</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow icon={<Mail className="h-5 w-5"/>} label="Email Professionnel" value={user.email_professionnel} />
                <InfoRow icon={<GraduationCap className="h-5 w-5"/>} label="Spécialité" value={user.specialite} />
            </CardContent>
        </Card>
      )}

    </div>
    {user && (
        <>
            <UpdatePhotoDialog 
                isOpen={isPhotoDialogOpen}
                setIsOpen={setIsPhotoDialogOpen}
                currentPhotoUrl={user.photo_url}
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
