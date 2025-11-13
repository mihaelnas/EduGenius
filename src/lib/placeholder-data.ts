
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
  // Les champs spécifiques peuvent être ajoutés ici ou gérés dans des types étendus
  // si on fait un appel à une route de détails comme /etudiant/{id}
  specialite?: string;
  matricule?: string;
};

export type UserForUpdate = Partial<Omit<AppUser, 'id' | 'cree_a'>>;


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
