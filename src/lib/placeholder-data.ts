
// Ce fichier contient des types qui devraient correspondre à vos schémas Pydantic.
// Il est crucial de les garder synchronisés avec l'API FastAPI.

// Correspond au schéma UserResponse de FastAPI
export type AppUser = {
  id: number;
  nom: string;
  prenom: string;
  nom_utilisateur: string;
  email: string;
  role: 'admin' | 'enseignant' | 'etudiant';
  statut: 'actif' | 'inactif';
  cree_a: string; // Devrait être un format de date ISO, ex: "2023-10-27T10:00:00"
  photo_url?: string;
  matricule?: string; // Spécifique à l'étudiant
};

// Schéma pour la mise à jour d'un utilisateur
export type UserForUpdate = Partial<Omit<AppUser, 'id' | 'cree_a'>>;

// Détails spécifiques à un étudiant, correspond à EtudiantDetail de FastAPI
export type EtudiantDetail = AppUser & {
  id_etudiant: number;
  date_naissance?: string;
  lieu_naissance?: string;
  genre?: string;
  adresse?: string;
  niveau_etude?: string;
  telephone?: string;
  filiere?: string;
  id_classe?: number;
};

// Détails spécifiques à un enseignant, correspond à EnseignantDetail de FastAPI
export type EnseignantDetail = AppUser & {
  id_enseignant: number;
  specialite?: string;
  email_professionnel?: string;
  genre?: string;
  telephone?: string;
  adresse?: string;
};


// Correspond au schéma ClasseResponse de FastAPI
export type Class = {
  id_classe: number;
  nom_classe: string;
  niveau: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  filiere: 'IG' | 'GB' | 'ASR' | 'GID' | 'OCC';
  annee_scolaire: string;
  effectif: number;
  enseignants: AppUser[];
};

// Correspond au schéma MatiereResponse de FastAPI
export type Subject = {
  id_matiere: number;
  nom_matiere: string;
  credit: number;
  semestre: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10';
  photo_url?: string;
  id_enseignant?: number;
  enseignant?: AppUser; // L'objet enseignant complet
};

// Correspond au schéma RessourceResponse de FastAPI
export type Resource = {
  id_ressource: number;
  type_resource: 'pdf' | 'video' | 'link';
  titre: string;
  url: string;
  id_cours: number;
};

// Correspond au schéma CoursResponse de FastAPI
export type Course = {
  id_cours: number;
  titre: string;
  contenu: string;
  id_matiere: number;
  id_enseignant: number;
  cree_a: string;
  matiere?: Subject; // Peut être inclus dans certaines réponses
  enseignant?: AppUser; // Peut être inclus
  resources: Resource[]; // Liste des ressources associées
};

// Correspond au schéma EvenementResponse de FastAPI
export type ScheduleEvent = {
  id_evenement: number;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  class_name: string;
  type: 'en-salle' | 'en-ligne';
  status: 'planifié' | 'reporté' | 'annulé' | 'effectué';
  conferenceLink?: string | null;
  id_enseignant: number;
};


// Combine nom and prenom for display name
export function getDisplayName(user?: { prenom?: string, nom?: string } | null): string {
    if (!user) return '';
    const firstName = user.prenom || '';
    const lastName = user.nom || '';
    return `${firstName} ${lastName}`.trim();
}
