'use server';
/**
 * @fileOverview User-related actions performed securely on the server.
 *
 * - activateAccount - A function to handle the final activation of a pre-registered user account.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';
import type { Student } from '@/lib/placeholder-data';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);

// Schema for the account activation flow
const ActivateAccountInputSchema = z.object({
  matricule: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  newAuthUserId: z.string(),
});
export type ActivateAccountInput = z.infer<typeof ActivateAccountInputSchema>;

export const activateAccount = ai.defineFlow(
  {
    name: 'activateAccountFlow',
    inputSchema: ActivateAccountInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
      userProfile: z.any().optional(),
    }),
  },
  async (input) => {
    try {
      const usersRef = db.collection('pending_users');
      const q = usersRef
        .where('matricule', '==', input.matricule.toUpperCase())
        .where('status', '==', 'inactive');
      
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        throw new Error("Aucun compte en attente correspondant à ce matricule n'a été trouvé.");
      }
      
      const matchingDocs = querySnapshot.docs.filter(doc => {
          const data = doc.data();
          const pendingFirstName = data.firstName?.trim().toLowerCase();
          const inputFirstName = input.firstName.trim().toLowerCase();
          const pendingLastName = data.lastName?.trim().toLowerCase();
          const inputLastName = input.lastName.trim().toLowerCase();

          return pendingFirstName === inputFirstName && pendingLastName === inputLastName;
      });

      if (matchingDocs.length === 0) {
          throw new Error("Les nom et prénom ne correspondent pas au compte pré-inscrit pour ce matricule.");
      }
      
      const pendingUserDoc = matchingDocs[0];
      const pendingUserData = pendingUserDoc.data();

      const batch = db.batch();
      
      const pendingDocRef = db.collection('pending_users').doc(pendingUserDoc.id);
      const newUserDocRef = db.collection('users').doc(input.newAuthUserId);
      
      const newUserProfile = {
        ...pendingUserData,
        id: input.newAuthUserId,
        email: input.email,
        status: 'active' as const,
        claimedAt: new Date().toISOString(),
      };

      batch.set(newUserDocRef, newUserProfile);
      batch.delete(pendingDocRef);

      if (newUserProfile.role === 'student') {
        const student = newUserProfile as Student;
        const className = `${student.niveau}-${student.filiere}-G${student.groupe}`.toUpperCase();
        const anneeScolaire = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        
        const classesRef = db.collection('classes');
        const classQuery = classesRef.where('name', '==', className).where("anneeScolaire", "==", anneeScolaire);
        const classSnapshot = await classQuery.get();

        if (!classSnapshot.empty) {
          const classDoc = classSnapshot.docs[0];
          batch.update(classDoc.ref, {
            studentIds: adminApp.firestore.FieldValue.arrayUnion(newUserProfile.id)
          });
        }
      }
      
      await batch.commit();

      return { success: true, userProfile: newUserProfile };

    } catch (e: any) {
      console.error("activateAccount flow error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
  }
);
