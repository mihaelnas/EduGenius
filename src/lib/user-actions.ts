
'use server';

import * as admin from 'firebase-admin';

/**
 * Deletes a user from Firebase Authentication.
 * This is a server-only action and requires admin privileges.
 *
 * @param uid The UID of the user to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  // Initialize Firebase Admin SDK if not already initialized.
  // In a Google Cloud environment (like App Hosting), initializeApp() without arguments
  // will automatically use the service account credentials of the environment.
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error);
      return { success: false, error: 'Erreur d\'initialisation du serveur Firebase.' };
    }
  }

  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete auth user ${uid}:`, error);
    
    let errorMessage = 'La suppression de l\'utilisateur a échoué.';
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'L\'utilisateur d\'authentification n\'a pas été trouvé.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
