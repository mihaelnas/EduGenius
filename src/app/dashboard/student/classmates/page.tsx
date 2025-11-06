import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { students } from '@/lib/placeholder-data';

export default function StudentClassmatesPage() {
  return (
     <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">My Classmates</h1>
      <p className="text-muted-foreground">Here are the other students in Grade 11 - Section B.</p>
       <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {students.map((student, index) => (
          <Card key={student.id} className="text-center">
            <CardContent className="p-6 flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${student.id}`} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{student.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
