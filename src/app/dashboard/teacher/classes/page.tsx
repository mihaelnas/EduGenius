
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { classes } from '@/lib/placeholder-data';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TeacherClassesPage() {
  // Mock: assumes the logged in teacher is Alice Johnson
  const teacherClasses = classes.filter(c => c.teachers.includes('Alice Johnson'));
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Classes</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teacherClasses.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">{c.name}</CardTitle>
              <CardDescription>Année Scolaire {c.anneeScolaire}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{c.studentIds.length} étudiants</span>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild className="w-full">
                    <Link href="#">Voir la classe <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
