
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';

// --- Initialisation du SDK Admin ---
// Cette fonction garantit que nous n'initialisons l'app qu'une seule fois.
function getAdminInstances(): { db: Firestore, auth: ReturnType<typeof getAuth> } {
  if (getApps().length > 0) {
    const app = getApps()[0];
    return { db: getFirestore(app), auth: getAuth(app) };
  }

  // Dans un environnement App Hosting, les credentials sont découverts automatiquement.
  const app = initializeApp();
  return { db: getFirestore(app), auth: getAuth(app) };
}


async function verifyAdminRole(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }
  const { db } = getAdminInstances();
  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
        const userRole = userDoc.data()?.role;
        if (userRole === 'admin') {
            return true;
        }
    }
    return false;
  } catch (error) {
    console.error(`Erreur critique pendant la vérification du rôle pour l'UID: ${userId}`, error);
    return false;
  }
}

// --- Actions Serveur ---

export async function secureCreateDocument(
  path: 'pending_users' | 'classes' | 'subjects',
  data: any,
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const isAdmin = await verifyAdminRole(userId);
  if (!isAdmin) {
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
  const isAdmin = await verifyAdminRole(userId);
  if (!isAdmin) {
    return { success: false, error: 'Permission denied: User is not an admin.' };
  }

  try {
    const { db } = getAdminInstances();
    await db.collection(path).doc(docId).update(data);
    revalidatePath(`/dashboard/admin/${path}`);
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
  const isAdmin = await verifyAdminRole(userId);
  if (!isAdmin) {
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
