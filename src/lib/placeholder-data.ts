
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
  teacherIds: string[];
  studentIds: string[];
  createdAt: string;
};

export type Subject = {
  id: string;
  name: string;
  credit: number;
  semestre: 'S1' | 'S2';
  photo?: string;
  teacherId?: string;
  classCount: number;
  createdAt: string;
};

export type Resource = {
  id: string;
  type: 'pdf' | 'video' | 'link';
  title: string;
  url: string;
};

export type Course = {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  resources: Resource[];
  createdAt: string;
};

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
   { 
    id: 'usr_6',
    nom: 'DOE',
    prenom: 'John',
    username: '@johnd',
    email: 'john.d@etudiant.com',
    role: 'student',
    status: 'active',
    createdAt: '2023-10-06',
    matricule: 'E12347',
    dateDeNaissance: '2002-08-21',
    lieuDeNaissance: 'Bordeaux',
    genre: 'Homme',
    telephone: '0612345678',
    adresse: '11 Rue de la Liberté, 33000 Bordeaux',
    niveau: 'L3',
    filiere: 'IG',
    photo: `https://i.pravatar.cc/150?u=usr_6`
  },
];


export const classes: Class[] = [
  { id: 'cls_1', name: 'Licence 3 - IG', niveau: 'L3', filiere: 'IG', anneeScolaire: '2023-2024', teacherIds: ['usr_2'], studentIds: ['usr_3', 'usr_6'], createdAt: '2023-09-01' },
  { id: 'cls_2', name: 'Master 1 - ASR', niveau: 'M1', filiere: 'ASR', anneeScolaire: '2023-2024', teacherIds: ['usr_5'], studentIds: ['usr_4'], createdAt: '2023-09-01' },
  { id: 'cls_3', name: 'Licence 3 - GID', niveau: 'L3', filiere: 'GID', anneeScolaire: '2023-2024', teacherIds: ['usr_2'], studentIds: [], createdAt: '2023-09-02' },
  { id: 'cls_4', name: 'Licence 2 - GB', niveau: 'L2', filiere: 'GB', anneeScolaire: '2023-2024', teacherIds: [], studentIds: [], createdAt: '2023-09-03' },
];

export const subjects: Subject[] = [
    { id: 'sub_1', name: 'Mathématiques Avancées', credit: 5, semestre: 'S1', teacherId: 'usr_2', classCount: 3, createdAt: '2023-09-01' },
    { id: 'sub_2', name: 'Physique Quantique', credit: 5, semestre: 'S1', teacherId: 'usr_2', classCount: 2, createdAt: '2023-09-01' },
    { id: 'sub_3', name: 'Littérature Comparée', credit: 4, semestre: 'S2', teacherId: 'usr_5', classCount: 4, createdAt: '2023-09-02' },
    { id: 'sub_4', name: 'Histoire Moderne', credit: 3, semestre: 'S2', teacherId: undefined, classCount: 1, createdAt: '2023-09-02' },
];

export const courses: Course[] = [
    { 
        id: 'crs_1',
        subjectId: 'sub_1', 
        title: 'Chapitre 1: Algèbre Linéaire', 
        content: 'Ce chapitre couvre les bases des espaces vectoriels, des matrices et des déterminants.',
        resources: [
            { id: 'res_1', type: 'pdf', title: 'Notes de cours - Chapitre 1', url: '#' },
            { id: 'res_2', type: 'video', title: 'Introduction à l\'algèbre linéaire', url: '#' }
        ],
        createdAt: '2023-10-10'
    },
    { 
        id: 'crs_2',
        subjectId: 'sub_1', 
        title: 'Chapitre 2: Analyse Complexe', 
        content: 'Introduction aux nombres complexes et aux fonctions de variables complexes.',
        resources: [],
        createdAt: '2023-10-15'
    },
    { 
        id: 'crs_3',
        subjectId: 'sub_2', 
        title: 'Unité 1: Postulats de la mécanique quantique', 
        content: 'Une exploration des six postulats fondamentaux de la mécanique quantique.',
        resources: [
            { id: 'res_3', type: 'link', title: 'Article de Wikipedia', url: '#' }
        ],
        createdAt: '2023-10-12'
    },
    { 
        id: 'crs_4',
        subjectId: 'sub_3', 
        title: 'Les Sonnets de Shakespeare', 
        content: 'Analyse approfondie des thèmes et des structures dans les sonnets de Shakespeare.',
        resources: [],
        createdAt: '2023-10-20'
    },
];

export const schedule: ScheduleEvent[] = [
  { id: 'evt_1', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', subject: 'Mathématiques Avancées', class: 'Licence 3 - IG', teacherId: 'usr_2', type: 'en-salle', status: 'planifié' },
  { id: 'evt_2', date: new Date().toISOString().split('T')[0], startTime: '11:00', endTime: '12:00', subject: 'Physique Quantique', class: 'Licence 3 - GID', teacherId: 'usr_2', type: 'en-ligne', status: 'planifié', conferenceLink: 'https://meet.google.com/xyz-abc-def' },
  { id: 'evt_3', date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], startTime: '14:00', endTime: '16:00', subject: 'Littérature Comparée', class: 'Master 1 - ASR', teacherId: 'usr_5', type: 'en-salle', status: 'planifié' },
];

export const studentSubjects = subjects.slice(0, 3); // Mock: l'étudiant est inscrit aux 3 premières matières

export const studentCourses = courses.filter(c => studentSubjects.some(s => s.id === c.subjectId));


export const students = [
  { id: 'stu_1', name: 'Eva Green' },
  { id: 'stu_2', name: 'Frank Miller' },
  { id: 'stu_3', name: 'Grace Hopper' },
  { id: 'stu_4', name: 'Henry Ford' },
];


// Combine nom and prenom for display name
export function getDisplayName(user: { prenom: string, nom: string }): string {
    return `${user.prenom} ${user.nom}`;
}
