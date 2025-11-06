import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { studentCourses, studentSubjects, subjects } from '@/lib/placeholder-data';
import { BookOpen } from 'lucide-react';

export default function StudentCoursesPage() {

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Mes Cours</h1>
      <p className="text-muted-foreground">Accédez ici à tous vos supports de cours et contenus.</p>
      <div className="mt-6">
        <Accordion type="single" collapsible className="w-full">
            {studentSubjects.map(subject => (
                 <AccordionItem key={subject.id} value={`item-${subject.id}`}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        {subject.name}
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-3 pl-4 border-l-2 ml-2">
                            {studentCourses.filter(c => c.subjectId === subject.id).map(course => (
                                <a key={course.id} href="#" className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <span className="font-medium text-foreground/80">{course.title}</span>
                                </a>
                            ))}
                        </div>
                    </AccordionContent>
                 </AccordionItem>
            ))}
        </Accordion>
      </div>
    </>
  );
}
