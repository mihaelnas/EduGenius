
'use server';

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

/**
 * Deletes a user from Firebase Authentication.
 * This is a server-only action and requires admin privileges.
 *
 * @param uid The UID of the user to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete auth user ${uid}:`, error);
    return { success: false, error: error.message };
  }
}

    