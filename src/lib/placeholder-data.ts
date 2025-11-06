export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  createdAt: string;
};

export type Class = {
  id: string;
  name: string;
  teacher?: string;
  studentCount: number;
  createdAt: string;
};

export type Subject = {
  id: string;
  name: string;
  teacher?: string;
  classCount: number;
  createdAt: string;
};


export const users: User[] = [
  { id: 'usr_1', name: 'Admin User', email: 'admin@edugenius.com', role: 'admin', status: 'active', createdAt: '2023-10-01' },
  { id: 'usr_2', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'teacher', status: 'active', createdAt: '2023-10-02' },
  { id: 'usr_3', name: 'Bob Williams', email: 'bob.w@example.com', role: 'student', status: 'active', createdAt: '2023-10-03' },
  { id: 'usr_4', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'student', status: 'inactive', createdAt: '2023-10-04' },
  { id: 'usr_5', name: 'Diana Prince', email: 'diana.p@example.com', role: 'teacher', status: 'active', createdAt: '2023-10-05' },
];

export const classes: Class[] = [
  { id: 'cls_1', name: 'Grade 10 - Section A', teacher: 'Alice Johnson', studentCount: 32, createdAt: '2023-09-01' },
  { id: 'cls_2', name: 'Grade 11 - Section B', teacher: 'Diana Prince', studentCount: 28, createdAt: '2023-09-01' },
  { id: 'cls_3', name: 'Grade 12 - Physics', teacher: 'Alice Johnson', studentCount: 25, createdAt: '2023-09-02' },
  { id: 'cls_4', name: 'Grade 9 - History', teacher: undefined, studentCount: 35, createdAt: '2023-09-03' },
];

export const subjects: Subject[] = [
    { id: 'sub_1', name: 'Mathematics', teacher: 'Alice Johnson', classCount: 3, createdAt: '2023-09-01' },
    { id: 'sub_2', name: 'Physics', teacher: 'Alice Johnson', classCount: 2, createdAt: '2023-09-01' },
    { id: 'sub_3', name: 'Literature', teacher: 'Diana Prince', classCount: 4, createdAt: '2023-09-02' },
    { id: 'sub_4', name: 'History', teacher: undefined, classCount: 1, createdAt: '2023-09-02' },
];

export const students = [
  { id: 'stu_1', name: 'Eva Green' },
  { id: 'stu_2', name: 'Frank Miller' },
  { id: 'stu_3', name: 'Grace Hopper' },
  { id: 'stu_4', name: 'Henry Ford' },
];

export const courses = [
    { id: 'crs_1', subject: 'Mathematics', title: 'Chapter 1: Algebra Basics', content: '...' },
    { id: 'crs_2', subject: 'Mathematics', title: 'Chapter 2: Geometry', content: '...' },
    { id: 'crs_3', subject: 'Physics', title: 'Unit 1: Kinematics', content: '...' },
    { id: 'crs_4', subject: 'Literature', title: 'Shakespeare\'s Sonnets', content: '...' },
];
