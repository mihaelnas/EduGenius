'use server';
/**
 * @fileOverview User-related actions performed securely on the server.
 *
 * - activateAccount - A function to handle the final activation of a pre-registered user account.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/firebase-admin';
import type { Student, Admin } from '@/lib/placeholder-data';


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
      const firestore = db;

      // Handle special admin creation case
      if (input.email === 'rajo.harisoa7@gmail.com') {
          const newAdminProfile: Admin = {
              id: input.newAuthUserId,
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email,
              username: `@${input.firstName.toLowerCase()}`,
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString(),
          };

          // Set custom claim for admin role
          await getAuth().setCustomUserClaims(input.newAuthUserId, { admin: true });
          
          // Create user document in Firestore
          await firestore.collection('users').doc(input.newAuthUserId).set(newAdminProfile);
          
          return { success: true, userProfile: newAdminProfile };
      }


      const usersRef = firestore.collection('pending_users');
      // Query for all inactive users. The filtering will happen in server-side code.
      const q = usersRef.where('status', '==', 'inactive');
      
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        console.log("No pending users with 'inactive' status found.");
        throw new Error("Aucun compte en attente d'activation n'a été trouvé.");
      }
      
      // Normalize input from the form for robust comparison
      const inputMatricule = input.matricule.trim().toUpperCase();
      const inputFirstName = input.firstName.trim().toLowerCase();
      const inputLastName = input.lastName.trim().toLowerCase();

      console.log('--- Début de la recherche ---');
      console.log('Données du formulaire (normalisées):', {
        matricule: inputMatricule,
        firstName: inputFirstName,
        lastName: inputLastName,
      });

      // Find the matching document by iterating through the results
      const matchingDoc = querySnapshot.docs.find(doc => {
          const data = doc.data();
          // Normalize data from Firestore for robust comparison
          const pendingMatricule = data.matricule?.trim().toUpperCase();
          const pendingFirstName = data.firstName?.trim().toLowerCase();
          const pendingLastName = data.lastName?.trim().toLowerCase();

          const matriculeMatch = pendingMatricule === inputMatricule;
          const firstNameMatch = pendingFirstName === inputFirstName;
          const lastNameMatch = pendingLastName === inputLastName;

          console.log(`\nComparaison avec le document pending_user ID: ${doc.id}`);
          console.log('  DB Data ->', { matricule: pendingMatricule, firstName: pendingFirstName, lastName: pendingLastName });
          console.log('  Form Data ->', { matricule: inputMatricule, firstName: inputFirstName, lastName: inputLastName });
          console.log('  Résultats de la comparaison:', { matriculeMatch, firstNameMatch, lastNameMatch });

          return matriculeMatch && firstNameMatch && lastNameMatch;
      });
      
      console.log('--- Fin de la recherche ---');

      if (!matchingDoc) {
          console.log('Aucun document correspondant trouvé après avoir parcouru tous les utilisateurs en attente.');
          throw new Error("Les informations saisies (matricule, nom, prénom) ne correspondent à aucun compte en attente. Veuillez vérifier et réessayer.");
      }
      
      console.log(`Document correspondant trouvé ! ID: ${matchingDoc.id}`);
      const pendingUserData = matchingDoc.data();

      const batch = firestore.batch();
      
      const pendingDocRef = firestore.collection('pending_users').doc(matchingDoc.id);
      const newUserDocRef = firestore.collection('users').doc(input.newAuthUserId);
      
      const newUserProfile = {
        ...pendingUserData,
        id: input.newAuthUserId,
        email: input.email,
        status: 'active' as const,
        claimedAt: new Date().toISOString(),
      };

      // Set custom claim for non-admin roles if needed (e.g., role: 'student')
      if (newUserProfile.role) {
         await getAuth().setCustomUserClaims(input.newAuthUserId, { role: newUserProfile.role });
      }

      batch.set(newUserDocRef, newUserProfile);
      batch.delete(pendingDocRef);

      if (newUserProfile.role === 'student') {
        const student = newUserProfile as Student;
        if (student.niveau && student.filiere && student.groupe) {
          const className = `${student.niveau}-${student.filiere}-G${student.groupe}`.toUpperCase();
          const anneeScolaire = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
          
          const classesRef = firestore.collection('classes');
          const classQuery = classesRef.where('name', '==', className).where("anneeScolaire", "==", anneeScolaire);
          const classSnapshot = await classQuery.get();

          if (!classSnapshot.empty) {
            const classDoc = classSnapshot.docs[0];
            batch.update(classDoc.ref, {
              studentIds: FieldValue.arrayUnion(newUserProfile.id)
            });
          }
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
