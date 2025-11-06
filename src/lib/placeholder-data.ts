
export type User = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  username: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  createdAt: string;
  photo?: string;
  genre?: 'Homme' | 'Femme';
  telephone?: string;
  adresse?: string;
};

export type Student = User & {
  role: 'student';
  matricule: string;
  dateDeNaissance: string;
  lieuDeNaissance: string;
  niveau: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  filiere: 'IG' | 'GB' | 'ASR' | 'GID' | 'OCC';
};

export type Teacher = User & {
  role: 'teacher';
  emailPro: string;
  specialite: string;
};

export type Admin = User & {
  role: 'admin';
};

export type AppUser = Student | Teacher | Admin;

export type Class = {
  id: string;
  name: string;
  niveau: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  filiere: 'IG' | 'GB' | 'ASR' | 'GID' | 'OCC';
  anneeScolaire: string; // e.g., "2023-2024"
  teacher?: string;
  studentCount: number;
  createdAt: string;
};

export type Subject = {
  id: string;
  name: string;
  credit: number;
  semestre: 'S1' | 'S2';
  photo?: string;
  teacher?: string;
  classCount: number;
  createdAt: string;
};

export const users: AppUser[] = [
  { 
    id: 'usr_1', 
    nom: 'ADMIN', 
    prenom: 'User',
    username: '@admin',
    email: 'admin@edugenius.com', 
    role: 'admin', 
    status: 'active', 
    createdAt: '2023-10-01' 
  },
  { 
    id: 'usr_2',
    nom: 'JOHNSON',
    prenom: 'Alice',
    username: '@alicej',
    email: 'alice.j@enseignant.com',
    emailPro: 'alice.johnson@univ.edu',
    role: 'teacher',
    status: 'active',
    createdAt: '2023-10-02',
    genre: 'Femme',
    telephone: '0123456789',
    adresse: '123 Rue de la Paix, 75001 Paris',
    specialite: 'Mathématiques',
    photo: `https://i.pravatar.cc/150?u=usr_2`
  },
  { 
    id: 'usr_3',
    nom: 'WILLIAMS',
    prenom: 'Bob',
    username: '@bobw',
    email: 'bob.w@etudiant.com',
    role: 'student',
    status: 'active',
    createdAt: '2023-10-03',
    matricule: 'E12345',
    dateDeNaissance: '2002-05-15',
    lieuDeNaissance: 'Lyon',
    genre: 'Homme',
    telephone: '0987654321',
    adresse: '456 Avenue des Champs-Élysées, 75008 Paris',
    niveau: 'L3',
    filiere: 'IG',
    photo: `https://i.pravatar.cc/150?u=usr_3`
  },
  { 
    id: 'usr_4',
    nom: 'BROWN',
    prenom: 'Charlie',
    username: '@charlieb',
    email: 'charlie.b@etudiant.com',
    role: 'student',
    status: 'inactive',
    createdAt: '2023-10-04',
    matricule: 'E12346',
    dateDeNaissance: '2001-11-20',
    lieuDeNaissance: 'Marseille',
    genre: 'Homme',
    telephone: '0112233445',
    adresse: '789 Boulevard Saint-Germain, 75006 Paris',
    niveau: 'M1',
    filiere: 'ASR',
    photo: `https://i.pravatar.cc/150?u=usr_4`
  },
  { 
    id: 'usr_5',
    nom: 'PRINCE',
    prenom: 'Diana',
    username: '@dianap',
    email: 'diana.p@enseignant.com',
    emailPro: 'diana.prince@univ.edu',
    role: 'teacher',
    status: 'active',
    createdAt: '2023-10-05',
    genre: 'Femme',
    telephone: '0554433221',
    adresse: '101 Rue de Rivoli, 75001 Paris',
    specialite: 'Littérature',
    photo: `https://i.pravatar.cc/150?u=usr_5`
  },
];


export const classes: Class[] = [
  { id: 'cls_1', name: 'Licence 3 - IG', niveau: 'L3', filiere: 'IG', anneeScolaire: '2023-2024', teacher: 'Alice Johnson', studentCount: 32, createdAt: '2023-09-01' },
  { id: 'cls_2', name: 'Master 1 - ASR', niveau: 'M1', filiere: 'ASR', anneeScolaire: '2023-2024', teacher: 'Diana Prince', studentCount: 28, createdAt: '2023-09-01' },
  { id: 'cls_3', name: 'Licence 3 - GID', niveau: 'L3', filiere: 'GID', anneeScolaire: '2023-2024', teacher: 'Alice Johnson', studentCount: 25, createdAt: '2023-09-02' },
  { id: 'cls_4', name: 'Licence 2 - GB', niveau: 'L2', filiere: 'GB', anneeScolaire: '2023-2024', teacher: undefined, studentCount: 35, createdAt: '2023-09-03' },
];

export const subjects: Subject[] = [
    { id: 'sub_1', name: 'Mathématiques Avancées', credit: 5, semestre: 'S1', teacher: 'Alice Johnson', classCount: 3, createdAt: '2023-09-01' },
    { id: 'sub_2', name: 'Physique Quantique', credit: 5, semestre: 'S1', teacher: 'Alice Johnson', classCount: 2, createdAt: '2023-09-01' },
    { id: 'sub_3', name: 'Littérature Comparée', credit: 4, semestre: 'S2', teacher: 'Diana Prince', classCount: 4, createdAt: '2023-09-02' },
    { id: 'sub_4', name: 'Histoire Moderne', credit: 3, semestre: 'S2', teacher: undefined, classCount: 1, createdAt: '2023-09-02' },
];

export const students = [
  { id: 'stu_1', name: 'Eva Green' },
  { id: 'stu_2', name: 'Frank Miller' },
  { id: 'stu_3', name: 'Grace Hopper' },
  { id: 'stu_4', name: 'Henry Ford' },
];

export const courses = [
    { id: 'crs_1', subject: 'Mathématiques Avancées', title: 'Chapitre 1: Algèbre Linéaire', content: '...' },
    { id: 'crs_2', subject: 'Mathématiques Avancées', title: 'Chapitre 2: Analyse Complexe', content: '...' },
    { id: 'crs_3', subject: 'Physique Quantique', title: 'Unité 1: Postulats de la mécanique quantique', content: '...' },
    { id: 'crs_4', subject: 'Littérature Comparée', title: 'Les Sonnets de Shakespeare', content: '...' },
];

// Combine nom and prenom for display name
export function getDisplayName(user: { prenom: string, nom: string }): string {
    return `${user.prenom} ${user.nom}`;
}

    