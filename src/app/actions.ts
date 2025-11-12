'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import type { Admin } from '@/lib/placeholder-data';

const ADMIN_APP_NAME = 'firebase-admin-app-school-management';

function getAdminInstances(): { db: Firestore; auth: ReturnType<typeof getAuth>; adminApp: App } {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { db: getFirestore(existingApp), auth: getAuth(existingApp), adminApp: existingApp };
  }

  const adminApp = initializeApp({}, ADMIN_APP_NAME);
  
  return { db: getFirestore(adminApp), auth: getAuth(adminApp), adminApp: adminApp };
}

const ActivateAccountInputSchema = z.object({
  matricule: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  newAuthUserId: z.string(),
});
type ActivateAccountInput = z.infer<typeof ActivateAccountInputSchema>;

export async function activateAccount(
  input: ActivateAccountInput
): Promise<{ success: boolean; error?: string; userProfile?: any }> {
    try {
      const { db, auth: adminAuth } = getAdminInstances();

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
          await adminAuth.setCustomUserClaims(input.newAuthUserId, { admin: true, role: 'admin' });
          await db.collection('users').doc(input.newAuthUserId).set(newAdminProfile);
          return { success: true, userProfile: newAdminProfile };
      }

      const usersRef = db.collection('pending_users');
      const q = usersRef.where('status', '==', 'inactive');
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        throw new Error("Aucun compte en attente d'activation n'a été trouvé.");
      }
      
      const inputMatricule = input.matricule.trim().toUpperCase();
      const inputFirstName = input.firstName.trim().toLowerCase();
      const inputLastName = input.lastName.trim().toLowerCase();

      const matchingDoc = querySnapshot.docs.find(doc => {
          const data = doc.data();
          const pendingMatricule = data.matricule?.trim().toUpperCase();
          const pendingFirstName = data.firstName?.trim().toLowerCase();
          const pendingLastName = data.lastName?.trim().toLowerCase();
          return pendingMatricule === inputMatricule && pendingFirstName === inputFirstName && pendingLastName === inputLastName;
      });
      
      if (!matchingDoc) {
          throw new Error("Les informations saisies (matricule, nom, prénom) ne correspondent à aucun compte en attente. Veuillez vérifier et réessayer.");
      }
      
      const pendingUserData = matchingDoc.data();
      const batch = db.batch();
      const pendingDocRef = db.collection('pending_users').doc(matchingDoc.id);
      const newUserDocRef = db.collection('users').doc(input.newAuthUserId);
      
      const newUserProfile = {
        ...pendingUserData,
        id: input.newAuthUserId,
        email: input.email,
        username: `@${input.firstName.toLowerCase()}`,
        status: 'active' as const,
        claimedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (newUserProfile.role) {
         await adminAuth.setCustomUserClaims(input.newAuthUserId, { role: newUserProfile.role });
      }

      batch.set(newUserDocRef, newUserProfile);
      batch.delete(pendingDocRef);
      
      await batch.commit();

      return { success: true, userProfile: newUserProfile };

    } catch (e: any) {
      console.error("activateAccount action error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
}
