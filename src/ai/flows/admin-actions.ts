'use server';
/**
 * @fileOverview Administrative actions performed securely on the server.
 *
 * - secureCreateDocument - A function to securely create documents in Firestore.
 * - secureUpdateDocument - A function to securely update documents in Firestore.
 * - secureDeleteDocument - A function to securely delete documents in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

// This function now correctly checks Firestore for the admin role.
async function verifyAdminRole(userId: string): Promise<boolean> {
  if (!userId) {
    console.log('Admin verification failed: No userId provided.');
    return false;
  }
  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      console.log(`Admin verification successful for UID: ${userId}`);
      return true;
    } else {
      console.log(`Admin verification failed for UID: ${userId}. User doc exists: ${userDoc.exists}, role: ${userDoc.data()?.role}`);
      return false;
    }
  } catch (error) {
    console.error(`Error during admin verification for UID: ${userId}`, error);
    return false;
  }
}


// Schema and Flow for Document Creation
const SecureCreateDocumentInputSchema = z.object({
  collection: z.enum(['pending_users', 'classes', 'subjects']),
  data: z.any(),
  userId: z.string(),
});
export type SecureCreateDocumentInput = z.infer<typeof SecureCreateDocumentInputSchema>;

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
      const isAdmin = await verifyAdminRole(input.userId);
      if (!isAdmin) {
        return { success: false, error: 'Permission denied: User is not an admin.' };
      }

      const documentData = {
          ...input.data,
          creatorId: input.userId,
          createdAt: new Date().toISOString(),
      };
      const docRef = await db.collection(input.collection).add(documentData);
      return { success: true, id: docRef.id };
    } catch (e: any) {
      console.error("secureCreateDocument flow error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
  }
);


// Schema and Flow for Document Update
const SecureUpdateDocumentInputSchema = z.object({
  collection: z.enum(['users', 'classes', 'subjects']),
  docId: z.string(),
  data: z.any(),
  userId: z.string(),
});
export type SecureUpdateDocumentInput = z.infer<typeof SecureUpdateDocumentInputSchema>;

export const secureUpdateDocument = ai.defineFlow(
  {
    name: 'secureUpdateDocument',
    inputSchema: SecureUpdateDocumentInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const isAdmin = await verifyAdminRole(input.userId);
      if (!isAdmin) {
        return { success: false, error: 'Permission denied: User is not an admin.' };
      }
      await db.collection(input.collection).doc(input.docId).update(input.data);
      return { success: true };
    } catch (e: any) {
      console.error("secureUpdateDocument flow error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
  }
);


// Schema and Flow for Document Deletion
const SecureDeleteDocumentInputSchema = z.object({
  collection: z.enum(['users', 'classes', 'subjects']),
  docId: z.string(),
  userId: z.string(),
});
export type SecureDeleteDocumentInput = z.infer<typeof SecureDeleteDocumentInputSchema>;

export const secureDeleteDocument = ai.defineFlow(
  {
    name: 'secureDeleteDocument',
    inputSchema: SecureDeleteDocumentInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const isAdmin = await verifyAdminRole(input.userId);
      if (!isAdmin) {
        return { success: false, error: 'Permission denied: User is not an admin.' };
      }
      await db.collection(input.collection).doc(input.docId).delete();
      return { success: true };
    } catch (e: any) {
      console.error("secureDeleteDocument flow error:", e);
      return { success: false, error: e.message || 'An unknown server error occurred.' };
    }
  }
);
