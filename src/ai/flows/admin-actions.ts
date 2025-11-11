'use server';
/**
 * @fileOverview Administrative actions performed securely on the server.
 *
 * - secureCreateDocument - A function to securely create documents in Firestore.
 * - SecureCreateDocumentInput - The input type for the secureCreateDocument function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { User, Class, Subject } from '@/lib/placeholder-data';
import { firebaseConfig } from '@/firebase/config';

// Define schemas for input validation
const SecureCreateDocumentInputSchema = z.object({
  collection: z.enum(['pending_users', 'classes', 'subjects']),
  data: z.any(),
  userId: z.string(),
});
export type SecureCreateDocumentInput = z.infer<typeof SecureCreateDocumentInputSchema>;

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


/**
 * A server-side flow to create a document after verifying admin privileges.
 * @param {SecureCreateDocumentInput} input - The collection name and data for the new document.
 * @returns {Promise<{success: boolean, id?: string, error?: string}>} - The result of the operation.
 */
export const secureCreateDocument = ai.defineFlow(
  {
    name: 'secureCreateDocument',
    inputSchema: SecureCreateDocumentInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      id: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      // 1. Verify if the calling user is an admin
      const userDocRef = db.collection('users').doc(input.userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return { success: false, error: 'Permission denied: User is not an admin.' };
      }
      
      const documentData = {
          ...input.data,
          creatorId: input.userId, // Ensure creatorId is always set
          createdAt: new Date().toISOString(),
      }

      // 2. If the user is an admin, create the document
      const docRef = await db.collection(input.collection).add(documentData);

      return { success: true, id: docRef.id };

    } catch (e: any) {
      console.error("secureCreateDocument flow error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
  }
);
