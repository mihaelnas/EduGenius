import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, Book } from 'lucide-react';

const stats = [
    { title: "Total Students", value: "1,250", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Total Teachers", value: "80", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Total Classes", value: "45", icon: <School className="h-4 w-4 text-muted-foreground" /> },
    { title: "Total Subjects", value: "30", icon: <Book className="h-4 w-4 text-muted-foreground" /> },
];

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Welcome to your Dashboard
      </h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
             <Card key={stat.title}>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                 {stat.title}
               </CardTitle>
               {stat.icon}
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{stat.value}</div>
               <p className="text-xs text-muted-foreground">
                 +20.1% from last month
               </p>
             </CardContent>
           </Card>
        ))}
      </div>
       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Activity feed will be displayed here.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Charts and graphs will be displayed here.</p>
              </CardContent>
            </Card>
          </div>
    </>
  );
}
