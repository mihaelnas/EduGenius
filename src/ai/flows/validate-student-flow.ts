'use server';
/**
 * @fileOverview Flow to validate a new student against an external API and assign them to a class.
 *
 * - validateAndAssignStudent - A function that handles the student validation and assignment process.
 * - StudentValidationInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({ projectId: firebaseConfig.projectId });
}
const db = getFirestore();

// Define the input schema for our flow
export const StudentValidationInputSchema = z.object({
  userId: z.string().describe('The Firebase Auth UID of the new user.'),
  matricule: z.string().describe("The student's registration ID."),
  firstName: z.string().describe("The student's first name."),
  lastName: z.string().describe("The student's last name."),
  niveau: z.string().describe("The student's academic level (e.g., L3)."),
  filiere: z.string().describe("The student's academic field (e.g., IG)."),
});
export type StudentValidationInput = z.infer<typeof StudentValidationInputSchema>;

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
    console.log(`Starting validation for user: ${input.userId}`);

    // 1. Call the external validation API (VeriGenius)
    try {
      const fetch = (await import('node-fetch')).default;
      const validationResponse = await fetch('https://veri-genius.vercel.app/', {
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
        // If the API returns a non-2xx status, it means validation failed.
        const errorBody = await validationResponse.text();
        throw new Error(
          `Validation API failed with status ${validationResponse.status}: ${errorBody}`
        );
      }
      
      console.log(`API validation successful for user: ${input.userId}`);

    } catch (error) {
      console.error('Error calling validation API:', error);
      // Stop the flow if external validation fails. The user will remain 'pending'.
      return {
        status: 'error',
        message: 'External API validation failed.',
      };
    }

    // 2. Validation was successful, find the corresponding class in Firestore.
    let classId: string | null = null;
    try {
      const className = `${input.niveau} - ${input.filiere}`; // This assumes a naming convention
      const classesRef = collection(db, 'classes');
      const q = query(
        classesRef,
        where('name', '==', className),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`Class "${className}" not found in Firestore.`);
      }

      const classDoc = querySnapshot.docs[0];
      classId = classDoc.id;
      
      // 3. Assign student to the class by updating the class's studentIds array
      const classStudentIds = classDoc.data().studentIds || [];
      if (!classStudentIds.includes(input.userId)) {
        await updateDoc(classDoc.ref, {
          studentIds: [...classStudentIds, input.userId],
        });
         console.log(`User ${input.userId} successfully added to class ${classId}`);
      }

    } catch (error) {
       console.error('Error finding or updating class:', error);
       // We proceed to activate the user, but flag that class assignment failed.
       // Manual assignment will be required by an admin.
       await updateDoc(doc(db, 'users', input.userId), { status: 'active' });
       return {
         status: 'warning',
         message: 'User activated, but automatic class assignment failed.',
       };
    }


    // 4. Update the user's status to 'active' in Firestore
    try {
        await updateDoc(doc(db, 'users', input.userId), { status: 'active' });
        console.log(`User ${input.userId} status updated to 'active'`);
    } catch(error) {
        console.error(`Failed to update user status for ${input.userId}:`, error);
        return {
            status: 'error',
            message: 'Failed to update user status after successful validation.'
        }
    }


    console.log(`Validation and assignment complete for user: ${input.userId}`);
    return {
      status: 'success',
      message: 'Student validated and assigned to class successfully.',
      classId: classId,
    };
  }
);
