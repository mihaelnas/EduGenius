
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Class, AppUser, getDisplayName, Student } from '@/lib/placeholder-data';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

type ManageStudentsDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    allStudents: AppUser[];
    onUpdate: (classId: string, studentIds: string[]) => void;
}

export function ManageStudentsDialog({ isOpen, setIsOpen, classData, allStudents, onUpdate }: ManageStudentsDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>(classData.studentIds);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    setSelectedStudentIds(classData.studentIds);
  }, [classData]);

  const handleCheckboxChange = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSave = () => {
    onUpdate(classData.id, selectedStudentIds);
  };
  
  const filteredStudents = allStudents.filter(student =>
    student.role === 'student' &&
    (student as Student).niveau === classData.niveau &&
    (getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase()) || 
     (student as Student).matricule.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gérer les étudiants pour "{classData.name}"</DialogTitle>
          <DialogDescription>
            Inscrivez ou désinscrivez des étudiants de cette classe. Actuellement {selectedStudentIds.length} étudiant(s).
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou matricule..." 
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-80 border rounded-md">
            <div className="space-y-1 p-2">
            {filteredStudents.map(student => (
                <div key={student.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(student.id, !!checked)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="font-normal w-full cursor-pointer flex justify-between items-center">
                        <span>{getDisplayName(student)}</span>
                        <Badge variant="outline">{(student as Student).matricule}</Badge>
                    </Label>
                </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-4">
                Aucun étudiant de niveau {classData.niveau} trouvé.
              </div>
            )}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="button" onClick={handleSave}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
