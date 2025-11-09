
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
    onAssign: (subjectId: string, teacherId: string | undefined) => void;
}

export function AssignSubjectTeacherDialog({ isOpen, setIsOpen, subject, allTeachers, onAssign }: AssignSubjectTeacherDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string | undefined>(subject.teacherId);
  
  React.useEffect(() => {
    setSelectedTeacherId(subject.teacherId);
  }, [subject]);

  const handleSave = () => {
    onAssign(subject.id, selectedTeacherId);
  }
  
  const handleRemove = () => {
    onAssign(subject.id, undefined);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assigner un enseignant à "{subject.name}"</DialogTitle>
          <DialogDescription>
            Sélectionnez un enseignant dans la liste pour l'assigner à cette matière.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="teacher-select">Enseignant</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger id="teacher-select">
                        <SelectValue placeholder="Sélectionner un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                    {allTeachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>{getDisplayName(teacher)}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          {subject.teacherId && (
            <Button type="button" variant="destructive" onClick={handleRemove}>
                Retirer l'enseignant
            </Button>
          )}
          <Button type="button" onClick={handleSave}>Sauvegarder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
