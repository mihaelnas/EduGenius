
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';
import type { AppUser, Student, Admin } from '@/lib/placeholder-data';
import { z } from 'zod';

const ADMIN_APP_NAME = 'firebase-admin-app-school-management';

function getAdminInstances(): { db: Firestore; auth: ReturnType<typeof getAuth> } {
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return { db: getFirestore(existingApp), auth: getAuth(existingApp) };
  }

  const adminApp = initializeApp({
    // ADC will be used in the Cloud environment
  }, ADMIN_APP_NAME);
  
  return { db: getFirestore(adminApp), auth: getAuth(adminApp) };
}


async function getAuthenticatedUser(userId: string): Promise<{user: DecodedIdToken, isAdmin: boolean} | {user: null, isAdmin: boolean}> {
    const { auth } = getAdminInstances();
    try {
        const userRecord = await auth.getUser(userId);
        const isAdmin = userRecord.customClaims?.admin === true;
        return { user: userRecord.toJSON() as DecodedIdToken, isAdmin };
    } catch (error) {
        return { user: null, isAdmin: false };
    }
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

export async function getUserDetails(
  userIdToView: string,
  currentUserId: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const { user, isAdmin } = await getAuthenticatedUser(currentUserId);
  const isOwnProfile = userIdToView === currentUserId;

  if (!user || (!isOwnProfile && !isAdmin)) {
    return { success: false, error: 'Permission denied.' };
  }

  try {
    const { db } = getAdminInstances();
    const userDocRef = db.collection('users').doc(userIdToView);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found.' };
    }
    
    revalidatePath(`/dashboard/profile/${userIdToView}`);
    return { success: true, user: userDoc.data() as AppUser };

  } catch (e: any) {
    console.error("getUserDetails action error:", e);
    return { success: false, error: e.message || 'An unknown server error occurred.' };
  }
}

export async function secureGetDocuments<T>(
    path: 'users' | 'classes' | 'subjects',
    currentUserId: string
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  const { user, isAdmin } = await getAuthenticatedUser(currentUserId);
  if (!user || !isAdmin) {
    return { success: false, error: 'Permission denied: User is not an admin.' };
  }

  try {
    const { db } = getAdminInstances();
    const snapshot = await db.collection(path).get();
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    return { success: true, data };
  } catch (e: any) {
    console.error(`secureGetDocuments action error for path ${path}:`, e);
    return { success: false, error: e.message || 'An unknown server error occurred.' };
  }
}


export async function secureCreateDocument(
  path: 'pending_users' | 'classes' | 'subjects',
  data: any,
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { user, isAdmin } = await getAuthenticatedUser(userId);
  if (!user || !isAdmin) {
    return { success: false, error: 'Permission denied: User is not an admin.' };
  }

  try {
    const { db } = getAdminInstances();
    const documentData = {
      ...data,
      creatorId: userId,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection(path).add(documentData);
    revalidatePath(`/dashboard/admin/${path}`);
    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error("secureCreateDocument action error:", e);
    return { success: false, error: e.message || 'An unknown server error occurred.' };
  }
}

export async function secureUpdateDocument(
  path: 'users' | 'classes' | 'subjects',
  docId: string,
  data: any,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, isAdmin } = await getAuthenticatedUser(userId);
  if (!user || !isAdmin) {
    return { success: false, error: 'Permission denied: User is not an admin.' };
  }

  try {
    const { db } = getAdminInstances();
    await db.collection(path).doc(docId).update(data);
    revalidatePath(`/dashboard/admin/${path}`);
    if (path === 'users') {
        revalidatePath(`/dashboard/profile/${docId}`);
    }
    return { success: true };
  } catch (e: any) {
    console.error("secureUpdateDocument action error:", e);
    return { success: false, error: e.message || 'An unknown server error occurred.' };
  }
}

export async function secureDeleteDocument(
  path: 'users' | 'classes' | 'subjects',
  docId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, isAdmin } = await getAuthenticatedUser(userId);
  if (!user || !isAdmin) {
    return { success: false, error: 'Permission denied: User is not an admin.' };
  }

  try {
    const { db } = getAdminInstances();
    await db.collection(path).doc(docId).delete();
    revalidatePath(`/dashboard/admin/${path}`);
    return { success: true };
  } catch (e: any) {
    console.error("secureDeleteDocument action error:", e);
    return { success: false, error: e.message || 'An unknown server error occurred.' };
  }
}
