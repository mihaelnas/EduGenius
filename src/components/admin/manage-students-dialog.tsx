
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
import { Class, AppUser, getDisplayName } from '@/lib/placeholder-data';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ManageStudentsDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    allStudents: AppUser[];
    onUpdate: (classId: number, studentIds: number[]) => void;
}

export function ManageStudentsDialog({ isOpen, setIsOpen, classData, allStudents, onUpdate }: ManageStudentsDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchStudentsInClass() {
      if (isOpen && classData) {
        setIsLoading(true);
        try {
          // Utilise la nouvelle route pour obtenir les étudiants actuels de la classe
          const studentsInClass: AppUser[] = await apiFetch(`/admin/etudiants_classe/${classData.id_classe}`);
          const studentIds = studentsInClass.map(student => student.id);
          setSelectedStudentIds(studentIds);
        } catch (error: any) {
           toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les étudiants de la classe." });
        } finally {
            setIsLoading(false);
        }
      }
    }
    fetchStudentsInClass();
  }, [classData, isOpen, toast]);

  const handleCheckboxChange = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSave = () => {
    onUpdate(classData.id_classe, selectedStudentIds);
  };
  
  // Filtre les étudiants en fonction de la recherche et de leur niveau (s'il est disponible)
  const filteredStudents = allStudents.filter(student => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = getDisplayName(student).toLowerCase().includes(searchTermLower) || 
                          (student.matricule && student.matricule.toLowerCase().includes(searchTermLower));
    return matchesSearch;
  });


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gérer les étudiants pour "{classData.nom_classe}"</DialogTitle>
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
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="space-y-1 p-2">
                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                    <div key={student.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                        <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={(checked) => handleCheckboxChange(student.id, !!checked)}
                        />
                        <Label htmlFor={`student-${student.id}`} className="font-normal w-full cursor-pointer flex justify-between items-center">
                            <span>{getDisplayName(student)}</span>
                            {student.matricule && <Badge variant="outline">{student.matricule}</Badge>}
                        </Label>
                    </div>
                )) : (
                     <div className="text-center text-sm text-muted-foreground p-4">
                        Aucun étudiant trouvé pour cette recherche.
                     </div>
                )}
                </div>
            )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="button" onClick={handleSave}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
