
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Subject, AppUser, getDisplayName } from '@/lib/placeholder-data';
import { Label } from '../ui/label';

type AssignSubjectTeacherDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    subject: Subject;
    allTeachers: AppUser[];
    onAssign: (subjectId: number, teacherId: number | undefined) => void;
}

export function AssignSubjectTeacherDialog({ isOpen, setIsOpen, subject, allTeachers, onAssign }: AssignSubjectTeacherDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<number | undefined>(subject.id_enseignant);
  
  React.useEffect(() => {
    setSelectedTeacherId(subject.id_enseignant);
  }, [subject]);

  const handleSave = () => {
    onAssign(subject.id_matiere, selectedTeacherId);
  }
  
  const handleRemove = () => {
    onAssign(subject.id_matiere, undefined);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un enseignant à "{subject.nom_matiere}"</DialogTitle>
          <DialogDescription>
            Sélectionnez un enseignant dans la liste pour l'assigner à cette matière.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="teacher-select">Enseignant</Label>
                <Select value={selectedTeacherId?.toString()} onValueChange={(value) => setSelectedTeacherId(Number(value))}>
                    <SelectTrigger id="teacher-select">
                        <SelectValue placeholder="Sélectionner un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                    {allTeachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>{getDisplayName(teacher)}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter className="justify-between">
            <div>
              {subject.id_enseignant && (
                <Button type="button" variant="destructive" onClick={handleRemove}>
                    Retirer l'enseignant
                </Button>
              )}
            </div>
            <div className='flex gap-2'>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="button" onClick={handleSave}>Sauvegarder</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
