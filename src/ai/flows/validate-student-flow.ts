
'use server';
/**
 * @fileOverview Flow to validate a new student, activate their account, and assign them to a class.
 * This flow calls an external API for validation and then uses the Firebase Admin SDK
 * to modify the database upon success.
 *
 * - validateAndAssignStudent - The main function that handles the entire validation and assignment process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInput } from '@/lib/placeholder-data';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// This ensures we have a single instance of the app.
if (!getApps().length) {
  initializeApp();
}
const adminFirestore = getFirestore();


// Define the input schema for the flow, matching what the client will send.
const FlowInputSchema = StudentValidationInputSchema;

// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;


/**
 * Main exported function that triggers the student validation and assignment flow.
 * This is called from the registration page.
 * @param input The student's data for validation and assignment.
 * @returns The result of the flow execution.
 */
export async function validateAndAssignStudent(input: z.infer<typeof FlowInputSchema>): Promise<FlowOutput> {
  return studentValidationAndAssignmentFlow(input);
}

// Define the Genkit flow
const studentValidationAndAssignmentFlow = ai.defineFlow(
  {
    name: 'studentValidationAndAssignmentFlow',
    inputSchema: FlowInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting validation for user ${input.userId}, matricule: ${input.matricule}`);
    
    try {
      // 1. Call the external validation API (VeriGenius)
      console.log(`[Flow] Calling VeriGenius API for matricule: ${input.matricule}`);
      const fetch = (await import('node-fetch')).default;
      
      const validationResponse = await fetch('https://veri-genius.vercel.app/api/validate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: input.matricule,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      });

      if (!validationResponse.ok) {
          const errorText = await validationResponse.text();
          console.error(`[Flow] API validation failed with status ${validationResponse.status}:`, errorText);
          const errorMessage = `La validation externe a échoué (Status: ${validationResponse.status}).`;
          return {
            status: 'error',
            message: errorMessage,
          };
      }
      
      const validationResult = await validationResponse.json() as { isValid: boolean, message?: string };
      
      if (validationResult.isValid === false) {
          console.error(`[Flow] API validation returned isValid: false.`, validationResult);
          const errorMessage = validationResult.message || 'Les données de l\'étudiant n\'ont pas pu être validées par le service externe.';
           return {
            status: 'error',
            message: `Validation externe refusée : ${errorMessage}`,
          };
      }

      console.log(`[Flow] API validation successful for matricule: ${input.matricule}`);

      // 2. Find the target class based on student's niveau and filiere
      const className = `${input.niveau}-${input.filiere}-G1`; // Assuming Group 1 for now
      console.log(`[Flow] Searching for class: ${className}`);
      
      const classesRef = adminFirestore.collection('classes');
      const classQuery = classesRef.where('name', '==', className).limit(1);
      const classSnapshot = await classQuery.get();

      if (classSnapshot.empty) {
        console.error(`[Flow] Class "${className}" not found in Firestore.`);
        return {
          status: 'error',
          message: `La classe d'assignation (${className}) n'a pas été trouvée. Veuillez contacter un administrateur.`,
        };
      }
      
      const classDoc = classSnapshot.docs[0];
      const classId = classDoc.id;
      console.log(`[Flow] Found class "${className}" with ID: ${classId}`);

      // 3. Use a transaction to activate user and assign to class
      await adminFirestore.runTransaction(async (transaction) => {
        const userDocRef = adminFirestore.collection('users').doc(input.userId);
        const classDocRef = adminFirestore.collection('classes').doc(classId);

        // Update user status to 'active'
        transaction.update(userDocRef, { status: 'active' });
        console.log(`[Flow] Transaction: Updating user ${input.userId} status to 'active'.`);

        // Add student ID to the class's studentIds array
        transaction.update(classDocRef, { 
            studentIds: adminFirestore.FieldValue.arrayUnion(input.userId) 
        });
        console.log(`[Flow] Transaction: Adding user ${input.userId} to class ${classId}.`);
      });

      console.log(`[Flow] Successfully activated and assigned user ${input.userId}.`);
      return {
        status: 'success',
        message: 'Student validated, activated, and assigned to class successfully.',
      };

    } catch (error: any) {
      console.error('[Flow] An unexpected error occurred:', error);
      const errorMessage = error.message || 'Une erreur inconnue est survenue durant le processus de validation et d\'assignation.';
      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }
);
