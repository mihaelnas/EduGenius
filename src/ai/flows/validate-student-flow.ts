
'use server';
/**
 * @fileOverview Flow to validate a new student against an external API and assign them to a class.
 *
 * - validateAndAssignStudent - A function that handles the student validation and assignment process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInput, StudentValidationInputSchema } from '@/lib/placeholder-data';
import { z } from 'zod';
import { initializeApp, getApps, App, deleteApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  classId: z.string().optional(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;

// Ensure Firebase Admin is initialized only once, with a unique name to avoid conflicts
function getAdminApp(): App {
  const appName = 'student-validation-flow-app';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  // Use a service account if available in the environment, otherwise default credentials
  return initializeApp({ projectId: firebaseConfig.projectId }, appName);
}

/**
 * Main exported function that triggers the student validation and assignment flow.
 * This is called from the registration page.
 * @param input The student's data.
 * @returns The result of the flow execution.
 */
export async function validateAndAssignStudent(input: StudentValidationInput): Promise<FlowOutput> {
  return studentValidationFlow(input);
}

// Define the Genkit flow
const studentValidationFlow = ai.defineFlow(
  {
    name: 'studentValidationFlow',
    inputSchema: StudentValidationInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting validation for user: ${input.userId}`);
    let adminApp: App | undefined;

    try {
      adminApp = getAdminApp();
      const adminDb = getFirestore(adminApp);
      
      // 1. Call the external validation API (VeriGenius)
      const fetch = (await import('node-fetch')).default;
      console.log(`[Flow] Calling VeriGenius API for matricule: ${input.matricule}`);
      const validationResponse = await fetch('https://veri-genius.vercel.app/api/validate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: input.matricule,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      });

      // Check if the response is valid JSON
      const responseText = await validationResponse.text();
      let validationResult;
      try {
        validationResult = JSON.parse(responseText);
      } catch (e) {
        console.error(`[Flow] API response was not valid JSON. Status: ${validationResponse.status}. Response: ${responseText}`);
        return {
          status: 'error',
          message: `L'API de validation a retourné une réponse invalide (Status: ${validationResponse.status}).`,
        };
      }


      if (!validationResponse.ok) {
        console.error(`[Flow] API validation failed with status ${validationResponse.status}:`, validationResult);
        return {
          status: 'error',
          message: `Validation externe échouée : ${validationResult.message || 'Erreur API inconnue'}`,
        };
      }
      
      console.log(`[Flow] API validation successful for user: ${input.userId}`, validationResult);

      // 2. Find the student's class in Firestore
      const studentClassName = `${input.niveau}-${input.filiere}-G1`;
      console.log(`[Flow] Searching for class: ${studentClassName}`);
      const classQuery = adminDb.collection('classes').where('name', '==', studentClassName).limit(1);
      const classSnapshot = await classQuery.get();

      if (classSnapshot.empty) {
        console.error(`[Flow] Class "${studentClassName}" not found for user ${input.userId}.`);
        return {
          status: 'error',
          message: `La classe "${studentClassName}" est introuvable. Veuillez contacter l'administration.`,
        };
      }

      const classDoc = classSnapshot.docs[0];
      const classId = classDoc.id;
      const userDocRef = adminDb.collection('users').doc(input.userId);

      console.log(`[Flow] Found class ${classId}. Activating user ${input.userId} and assigning to class.`);
      
      // 3. Use a transaction to update user and class
      await adminDb.runTransaction(async (transaction) => {
        // Update user status to 'active'
        transaction.update(userDocRef, { status: 'active' });
        // Add student ID to the class's studentIds array
        transaction.update(classDoc.ref, { studentIds: FieldValue.arrayUnion(input.userId) });
      });

      console.log(`[Flow] User ${input.userId} successfully activated and assigned to class ${classId}.`);

      return {
        status: 'success',
        message: 'Student successfully validated and assigned to class.',
        classId: classId,
      };

    } catch (error) {
      console.error('[Flow] An unexpected error occurred:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue durant le processus de validation.',
      };
    } finally {
        // Optional: Clean up the admin app if you want to be tidy, though not strictly necessary.
        if (adminApp) {
           // await deleteApp(adminApp);
        }
    }
  }
);
