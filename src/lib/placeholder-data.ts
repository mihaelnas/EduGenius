
export type User = {
  id: string;
  firstName: string;
  lastName: string;
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
  emailPro?: string;
  specialite?: string;
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
  subjectName: string;
  teacherId: string;
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

// Combine nom and prenom for display name
export function getDisplayName(user: { firstName?: string, lastName?: string }): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim();
}
