
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';
import type { AppUser } from '@/lib/placeholder-data';

// --- Initialisation Robuste du SDK Admin ---

// Variable pour tenir l'instance initialisée
let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Si des applications existent déjà, utilisez la première (scénario de hot-reloading)
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  
  // Scénario d'initialisation principal.
  // Dans un environnement de production sur Google Cloud (comme App Hosting),
  // initializeApp() sans arguments utilisera automatiquement les identifiants de l'environnement.
  // En développement local, il peut être nécessaire de définir GOOGLE_APPLICATION_CREDENTIALS.
  try {
     adminApp = initializeApp();
  } catch (error: any) {
    console.error("Échec de l'initialisation automatique de Firebase Admin. Assurez-vous que les variables d'environnement (comme GOOGLE_APPLICATION_CREDENTIALS) sont configurées pour le développement local.", error);
    // En cas d'échec, nous ne pouvons pas continuer.
    throw new Error("L'initialisation du SDK Admin a échoué. Le backend ne peut pas fonctionner.");
  }
  
  return adminApp;
}


function getAdminInstances(): { db: Firestore; auth: ReturnType<typeof getAuth> } {
  const app = getAdminApp();
  return { db: getFirestore(app), auth: getAuth(app) };
}


async function verifyAdminRole(userId: string): Promise<boolean> {
  if (!userId) {
    console.error("verifyAdminRole a été appelé sans userId.");
    return false;
  }
  
  try {
    const { db } = getAdminInstances();
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return true;
    }
    // Si le document n'existe pas ou si le rôle n'est pas admin
    return false;
  } catch (error) {
    console.error(`Erreur critique pendant la vérification du rôle pour l'UID: ${userId}`, error);
    return false;
  }
}

// --- Actions Serveur ---

export async function getUserDetails(
  userIdToView: string,
  currentUserId: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const isAdmin = await verifyAdminRole(currentUserId);
  if (!isAdmin) {
    // Si ce n'est pas un admin, on vérifie si l'utilisateur demande son propre profil.
    if (userIdToView !== currentUserId) {
      return { success: false, error: 'Permission denied: Not an admin and not accessing own profile.' };
    }
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
