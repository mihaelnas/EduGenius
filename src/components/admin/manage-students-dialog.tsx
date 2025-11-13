
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
import { Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type ManageStudentsDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    allStudents: AppUser[];
    onUpdate: (classId: number, studentIds: number[]) => void;
}

export function ManageStudentsDialog({ isOpen, setIsOpen, classData, allStudents, onUpdate }: ManageStudentsDialogProps) {
  const [currentStudents, setCurrentStudents] = React.useState<AppUser[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    async function fetchStudentsInClass() {
      if (isOpen) {
        // Supposons une route qui retourne les étudiants d'une classe.
        // À créer dans votre API FastAPI si elle n'existe pas.
        // Pour l'instant, on filtre la liste complète.
        // Dans l'idéal : const students = await apiFetch(`/admin/classe/${classData.id_classe}/etudiants`);
        const studentIdsInClass: number[] = []; // à remplir avec la réponse de l'API
        setSelectedStudentIds(studentIdsInClass);
      }
    }
    fetchStudentsInClass();
  }, [classData, isOpen]);

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
  
  const filteredStudents = allStudents.filter(student =>
    student.role === 'etudiant' &&
    // @ts-ignore - On suppose que le niveau est dans l'objet student détaillé
    (student.niveau === classData.niveau || !student.niveau) &&
    (getDisplayName(student).toLowerCase().includes(searchTerm.toLowerCase()) || 
     // @ts-ignore
     (student.matricule && student.matricule.toLowerCase().includes(searchTerm.toLowerCase())))
  );


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
                         {/* @ts-ignore */}
                        <Badge variant="outline">{student.matricule}</Badge>
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
