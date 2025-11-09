
'use server';

import * as admin from 'firebase-admin';

// Structure of the service account credentials
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}


/**
 * Deletes a user from Firebase Authentication.
 * This is a server-only action and requires admin privileges.
 *
 * @param uid The UID of the user to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  // Initialize Firebase Admin SDK if not already initialized, only when the function is called.
  if (!admin.apps.length) {
    try {
       const serviceAccount: ServiceAccount = {
        projectId: process.env.GCP_PROJECT_ID!,
        clientEmail: process.env.GCP_CLIENT_EMAIL!,
        privateKey: process.env.GCP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      } as ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return { success: false, error: 'Erreur d\'initialisation du serveur Firebase.' };
    }
  }

  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete auth user ${uid}:`, error);
    // Provide a more specific error message if available
    let errorMessage = 'La suppression de l\'utilisateur a échoué.';
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'L\'utilisateur d\'authentification n\'a pas été trouvé.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
