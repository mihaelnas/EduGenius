import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

const scheduleItems = [
    { time: '09:00 AM - 10:00 AM', class: 'Grade 10 - Section A', subject: 'Mathematics' },
    { time: '11:00 AM - 12:00 PM', class: 'Grade 12 - Physics', subject: 'Physics' },
    { time: '02:00 PM - 03:00 PM', class: 'Grade 10 - Section A', subject: 'Mathematics' },
];

export default function TeacherSchedulePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Schedule</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>Here are your classes for today, April 25, 2024.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {scheduleItems.map((item, index) => (
                             <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-semibold">{item.subject}</p>
                                    <p className="text-sm text-muted-foreground">{item.class}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={new Date()}
                    className="rounded-md"
                />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
