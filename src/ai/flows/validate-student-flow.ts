'use server';
/**
 * @fileOverview Flow to validate a new student against an external API and assign them to a class.
 *
 * - validateAndAssignStudent - A function that handles the student validation and assignment process.
 */

import { ai } from '@/ai/genkit';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { StudentValidationInput, StudentValidationInputSchema } from '@/lib/placeholder-data';
import { z } from 'zod';

// Initialize Firebase Admin SDK. It will automatically use the service account
// credentials available in the App Hosting environment.
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);


/**
 * Main exported function that triggers the student validation and assignment flow.
 * This is called from the registration page.
 * @param input The student's data.
 * @returns The result of the flow execution.
 */
export async function validateAndAssignStudent(input: StudentValidationInput) {
  return studentValidationFlow(input);
}

// Define the Genkit flow
const studentValidationFlow = ai.defineFlow(
  {
    name: 'studentValidationFlow',
    inputSchema: StudentValidationInputSchema,
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
      classId: z.string().optional(),
    }),
  },
  async (input) => {
    console.log(`[Flow] Starting validation for user: ${input.userId}`);

    // 1. Call the external validation API (VeriGenius)
    try {
      const fetch = (await import('node-fetch')).default;
      console.log(`[Flow] Calling VeriGenius API for matricule: ${input.matricule}`);
      const validationResponse = await fetch('https://veri-genius.vercel.app/api/validate-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: input.matricule, // The API expects 'studentId' for matricule
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      });

      if (!validationResponse.ok) {
        const errorBody = await validationResponse.json();
        console.error(`[Flow] API validation failed with status ${validationResponse.status}:`, errorBody);
        throw new Error(
          `Validation API failed with status ${validationResponse.status}: ${errorBody.message || 'Unknown API error'}`
        );
      }
      
      console.log(`[Flow] API validation successful for user: ${input.userId}`);

    } catch (error) {
      console.error('[Flow] Error calling validation API:', error);
      // The user remains pending, this is a silent failure for the user but logged for the admin.
      return {
        status: 'error',
        message: 'External API validation failed. User remains pending.',
      };
    }

    // 2. Validation was successful, find the corresponding class in Firestore.
    let classId: string | null = null;
    try {
      const className = `${input.niveau}-${input.filiere}-G1`; // Defaulting to G1 for now
      console.log(`[Flow] Searching for class: "${className}" for user ${input.userId}`);
      const classesRef = db.collection('classes');
      const q = classesRef
        .where('name', '==', className)
        .limit(1);
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        // If class is not found, we can't assign. We activate the user but flag this for an admin.
        console.warn(`[Flow] Class "${className}" not found for user ${input.userId}. Activating user but flagging for manual assignment.`);
        await db.collection('users').doc(input.userId).update({ status: 'active', classAssignmentStatus: 'failed_class_not_found' });
        return {
          status: 'warning',
          message: `User activated, but class "${className}" was not found. Manual assignment needed.`,
        };
      }

      const classDoc = querySnapshot.docs[0];
      classId = classDoc.id;
      
      // 3. Assign student to the class using Admin SDK
      console.log(`[Flow] Assigning user ${input.userId} to class ${classId}`);
      await classDoc.ref.update({
        studentIds: FieldValue.arrayUnion(input.userId),
      });
      console.log(`[Flow] User ${input.userId} successfully added to class ${classId}`);
      

    } catch (error) {
       console.error('[Flow] Error finding or updating class:', error);
       // This is a significant issue. We'll activate the user but flag that class assignment failed.
       await db.collection('users').doc(input.userId).update({ status: 'active', classAssignmentStatus: 'failed_db_error' });
       return {
         status: 'warning',
         message: 'User activated, but automatic class assignment failed due to a database error.',
       };
    }

    // 4. Update the user's status to 'active' in Firestore using Admin SDK
    try {
        console.log(`[Flow] Activating user ${input.userId}`);
        await db.collection('users').doc(input.userId).update({ status: 'active' });
        console.log(`[Flow] User ${input.userId} status updated to 'active'`);
    } catch(error) {
        console.error(`[Flow] Failed to update user status for ${input.userId}:`, error);
        // This is a critical failure. The user is already in a class, so we must report this.
        return {
            status: 'error',
            message: 'Failed to update user status after successful validation and class assignment.'
        }
    }


    console.log(`[Flow] Validation and assignment complete for user: ${input.userId}`);
    return {
      status: 'success',
      message: 'Student validated and assigned to class successfully.',
      classId: classId,
    };
  }
);
