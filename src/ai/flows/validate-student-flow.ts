
'use server';
/**
 * @fileOverview Flow to validate a new student and assign them to a class.
 * This flow uses the Firebase Admin SDK to perform privileged operations.
 *
 * - validateAndAssignStudent - The main function that handles the validation and assignment process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInputSchema, StudentValidationInput } from '@/lib/placeholder-data';
import { z } from 'zod';

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only if it hasn't been initialized yet.
// This prevents re-initialization errors during hot-reloads in development.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();


// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;


/**
 * Main exported function that triggers the student validation and assignment flow.
 * @param input The student's data for validation, including userId.
 * @returns The result of the operation.
 */
export async function validateAndAssignStudent(input: StudentValidationInput): Promise<FlowOutput> {
  return studentValidationFlow(input);
}

// Define the Genkit flow for external validation and subsequent Firestore operations
const studentValidationFlow = ai.defineFlow(
  {
    name: 'studentValidationFlow',
    inputSchema: StudentValidationInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting full validation for user: ${input.userId}`);
    
    try {
      // Step 1: Call the external validation API (VeriGenius)
      console.log(`[Flow] Calling external API for matricule: ${input.matricule}`);
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
          return {
            status: 'error',
            message: `La validation externe a échoué (Status: ${validationResponse.status}).`,
          };
      }
      
      const validationResult = await validationResponse.json() as { isValid: boolean, className?: string, message?: string };
      
      if (validationResult.isValid === false || !validationResult.className) {
          console.error(`[Flow] API validation returned invalid or missing className.`, validationResult);
          return {
            status: 'error',
            message: validationResult.message || "L'API de validation n'a pas retourné de classe valide.",
          };
      }

      console.log(`[Flow] API validation successful. Received class: ${validationResult.className}`);

      // Step 2: Use Admin SDK to perform privileged Firestore writes
      const userRef = db.collection('users').doc(input.userId);
      const classQuery = db.collection('classes').where('name', '==', validationResult.className).limit(1);

      return db.runTransaction(async (transaction) => {
          const classSnapshot = await transaction.get(classQuery);

          if (classSnapshot.empty) {
              console.error(`[Flow] Class "${validationResult.className}" not found in Firestore.`);
              // We must throw an error inside a transaction to abort it.
              throw new Error(`La classe d'assignation (${validationResult.className}) n'a pas été trouvée.`);
          }

          const classRef = classSnapshot.docs[0].ref;

          // Update user status to 'active'
          transaction.update(userRef, { status: 'active' });
          
          // Add user to the class's studentIds array
          transaction.update(classRef, { studentIds: admin.firestore.FieldValue.arrayUnion(input.userId) });
          
          console.log(`[Flow] Successfully activated user ${input.userId} and assigned to class ${validationResult.className}`);
          return; // Transactions return void on success
      }).then(() => {
          return {
            status: 'success' as const,
            message: 'Student validated, activated, and assigned to class successfully.',
          };
      }).catch((error: Error) => {
          // This will catch errors from the transaction, including the one we throw.
          console.error('[Flow] Firestore transaction failed:', error.message);
          return { status: 'error' as const, message: error.message };
      });

    } catch (error: any) {
      console.error('[Flow] An unexpected error occurred:', error);
      return {
        status: 'error',
        message: error.message || 'Une erreur inconnue est survenue durant le processus de validation.',
      };
    }
  }
);
