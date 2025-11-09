
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { useStorage, useUser } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  photo: z
    .any()
    .refine((files) => files?.length == 1, "Une image est requise.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `La taille maximale est de 5Mo.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Formats acceptés: .jpg, .jpeg, .png and .webp."
    ),
});

type FormValues = z.infer<typeof formSchema>;

type UpdatePhotoDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentPhotoUrl?: string;
    onUpdate: (newPhotoUrl: string) => void;
};

export function UpdatePhotoDialog({ isOpen, setIsOpen, currentPhotoUrl, onUpdate }: UpdatePhotoDialogProps) {
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(currentPhotoUrl);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema)
  });

  const fileRef = form.register("photo");

  React.useEffect(() => {
    setPreviewUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);
  
  const photoFile = form.watch('photo');

  React.useEffect(() => {
    if (photoFile && photoFile.length > 0) {
      const file = photoFile[0];
      if (file instanceof File) {
          const newPreviewUrl = URL.createObjectURL(file);
          setPreviewUrl(newPreviewUrl);
          return () => URL.revokeObjectURL(newPreviewUrl);
      }
    } else {
        setPreviewUrl(currentPhotoUrl);
    }
  }, [photoFile, currentPhotoUrl]);


  async function onSubmit(values: FormValues) {
    if (!user) {
        toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non authentifié."});
        return;
    }
    
    setIsUploading(true);
    setUploadProgress(30);

    const file = values.photo[0];
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `profile-pictures/${user.uid}/${fileName}`);

    try {
        await uploadBytes(storageRef, file);
        setUploadProgress(70);
        const downloadURL = await getDownloadURL(storageRef);
        setUploadProgress(100);
        onUpdate(downloadURL);
        setIsOpen(false);
    } catch(error) {
         toast({ variant: "destructive", title: "Erreur de téléversement", description: "Impossible de téléverser l'image."});
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (isUploading) return;
    setIsOpen(open);
    if (!open) {
      form.reset();
      setPreviewUrl(currentPhotoUrl);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mettre à jour la photo de profil</DialogTitle>
          <DialogDescription>
            Choisissez une image depuis votre appareil.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-4">
            <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl} />
                <AvatarFallback>
                    <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouvelle photo</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...fileRef} disabled={isUploading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isUploading && <Progress value={uploadProgress} className="w-full" />}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>Annuler</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Téléversement...
                  </>
                ) : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
