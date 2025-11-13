
// A REMPLACER PAR LES VRAIS SCHEMAS DE L'API

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
  cree_a: string;
  photo_url?: string;
  // Champs optionnels qui peuvent être présents dans des vues détaillées
  specialite?: string;
  email_professionnel?: string;
  matricule?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  genre?: string;
  adresse?: string;
  telephone?: string;
  niveau?: string;
  filiere?: string;
};

// Schéma pour la mise à jour d'un utilisateur
export type UserForUpdate = Partial<Omit<AppUser, 'id' | 'cree_a'>>;

// Détails spécifiques à un étudiant
export type EtudiantDetail = {
  id_etudiant: number;
  matricule: string;
  date_naissance: string;
  lieu_naissance: string;
  genre: string;
  adresse: string;
  niveau_etude: string;
  telephone: string;
  filiere: string;
  photo_url?: string;
  id_classe?: number;
};

// Détails spécifiques à un enseignant
export type EnseignantDetail = {
  id_enseignant: number;
  specialite: string;
  email_professionnel: string;
  genre: string;
  telephone: string;
  adresse: string;
  photo_url?: string;
};


// Correspond au schéma ClasseResponse de FastAPI
export type Class = {
  id_classe: number;
  nom_classe: string;
  niveau: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  filiere: 'IG' | 'GB' | 'ASR' | 'GID' | 'OCC';
  annee_scolaire: string;
  effectif: number;
  enseignants: AppUser[]; // FastAPI renverra probablement les objets enseignants
};

// Correspond au schéma Subject de placeholder, à adapter à FastAPI
export type Subject = {
  id: string;
  name: string;
  credit: number;
  semestre: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10';
  photo?: string;
  teacherId?: string;
  classCount: number;
  createdAt: string;
  creatorId?: string;
};

// Correspond au schéma Resource de placeholder, à adapter à FastAPI
export type Resource = {
  id: string;
  type: 'pdf' | 'video' | 'link';
  title: string;
  url: string;
};

// Correspond au schéma Course de placeholder, à adapter à FastAPI
export type Course = {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  resources: Resource[];
  createdAt: string;
};

// Correspond au schéma ScheduleEvent de placeholder, à adapter à FastAPI
export type ScheduleEvent = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
  teacherId: string;
  type: 'en-salle' | 'en-ligne';
  status: 'planifié' | 'reporté' | 'annulé' | 'effectué';
  conferenceLink?: string;
};


// Combine nom and prenom for display name
export function getDisplayName(user: { prenom?: string, nom?: string }): string {
    const firstName = user.prenom || '';
    const lastName = user.nom || '';
    return `${firstName} ${lastName}`.trim();
}
