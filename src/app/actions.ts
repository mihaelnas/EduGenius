
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import type { Admin, AppUser } from '@/lib/placeholder-data';
import { cookies } from 'next/headers';

const ADMIN_APP_NAME = 'firebase-admin-app-school-management';

// This function initializes and returns the Firebase Admin SDK instances.
// It's memoized to ensure it's only called once per server request.
function getAdminInstances(): { db: Firestore; auth: ReturnType<typeof getAuth>; adminApp: App } {
  // If an app with the same name already exists, use it.
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { 
      db: getFirestore(existingApp), 
      auth: getAuth(existingApp), 
      adminApp: existingApp 
    };
  }

  // If not, initialize a new app using the service account key.
  // This is the most reliable method for development and environments where the key is set.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Les informations d\'identification du compte de service Firebase ne sont pas définies. Veuillez définir FIREBASE_SERVICE_ACCOUNT_KEY dans vos variables d\'environnement.');
  }
  
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    // Initialize the new app with credentials
    const adminApp = initializeApp(
        { credential: cert(serviceAccount) }, 
        ADMIN_APP_NAME
    );
    
    return { 
      db: getFirestore(adminApp), 
      auth: getAuth(adminApp), 
      adminApp: adminApp 
    };
  } catch (e: any) {
    // This will catch JSON parsing errors or other initialization issues.
    console.error("Failed to initialize Firebase Admin SDK:", e);
    throw new Error(`Erreur lors de l'initialisation de Firebase Admin : ${e.message}`);
  }
}

const ActivateAccountInputSchema = z.object({
  matricule: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  newAuthUserId: z.string(),
  isAdminCreation: z.boolean(),
});
type ActivateAccountInput = z.infer<typeof ActivateAccountInputSchema>;

export async function activateAccount(
  input: ActivateAccountInput
): Promise<{ success: boolean; error?: string; userProfile?: any }> {
    try {
      const { db, auth: adminAuth } = getAdminInstances();
      
      // Explicit check for admin creation flow.
      if (input.isAdminCreation) {
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
          // Correctly set the custom claim to { admin: true }
          await adminAuth.setCustomUserClaims(input.newAuthUserId, { admin: true, role: 'admin' });
          await db.collection('users').doc(input.newAuthUserId).set(newAdminProfile);
          
          // Return immediately after handling the admin case.
          return { success: true, userProfile: newAdminProfile };
      }

      // Logic for non-admin users: find them in pending_users
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
      
      const newUserProfile: AppUser = {
        ...pendingUserData,
        id: input.newAuthUserId,
        email: input.email,
        username: `@${input.firstName.toLowerCase()}`,
        status: 'active' as const,
        claimedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (newUserProfile.role) {
         // For regular users, just set their role if it exists
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


