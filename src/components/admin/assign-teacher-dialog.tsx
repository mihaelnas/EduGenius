
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

type AssignTeacherDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    classData: Class;
    allTeachers: AppUser[];
    onAssign: (classId: number, teacherIds: number[]) => void;
}

export function AssignTeacherDialog({ isOpen, setIsOpen, classData, allTeachers, onAssign }: AssignTeacherDialogProps) {
  const [selectedTeacherIds, setSelectedTeacherIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    // Initialise les enseignants sélectionnés avec ceux déjà dans la classe
    if (classData) {
      setSelectedTeacherIds(classData.enseignants.map(t => t.id));
    }
  }, [classData]);

  const handleCheckboxChange = (teacherId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeacherIds(prev => [...prev, teacherId]);
    } else {
      setSelectedTeacherIds(prev => prev.filter(id => id !== teacherId));
    }
  };

  const handleSave = () => {
    onAssign(classData.id_classe, selectedTeacherIds);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Réinitialise l'état si on ferme la boite de dialogue
    if (!open && classData) {
       setSelectedTeacherIds(classData.enseignants.map(t => t.id));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les enseignants pour "{classData.nom_classe}"</DialogTitle>
          <DialogDescription>
            Cochez les enseignants que vous souhaitez assigner à cette classe.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64">
            <div className="space-y-2 p-1">
            {allTeachers.map(teacher => (
                <div key={teacher.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <Checkbox
                        id={`teacher-${teacher.id}`}
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(teacher.id, !!checked)}
                    />
                    <Label htmlFor={`teacher-${teacher.id}`} className="font-normal w-full cursor-pointer">
                        {getDisplayName(teacher)}
                    </Label>
                </div>
            ))}
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
