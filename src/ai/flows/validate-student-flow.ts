
'use server';
/**
 * @fileOverview Flow to validate a new student by calling an external API.
 * This flow ONLY performs the external validation and returns the result.
 * It does not interact with the Firestore database.
 *
 * - validateAndAssignStudent - The main function that handles the validation process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInputSchema, StudentValidationInput } from '@/lib/placeholder-data';
import { z } from 'zod';

// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;


/**
 * Main exported function that triggers the student validation flow.
 * @param input The student's data for validation, excluding userId.
 * @returns The result of the validation.
 */
export async function validateAndAssignStudent(input: Omit<StudentValidationInput, 'userId'>): Promise<FlowOutput> {
  return studentExternalValidationFlow(input);
}

// Define the Genkit flow for external validation only
const studentExternalValidationFlow = ai.defineFlow(
  {
    name: 'studentExternalValidationFlow',
    inputSchema: StudentValidationInputSchema.omit({ userId: true }), // We don't need userId for external validation
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting external validation for matricule: ${input.matricule}`);
    
    try {
      // Call the external validation API (VeriGenius)
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
      
      const validationResult = await validationResponse.json() as { isValid: boolean, message?: string };
      
      if (validationResult.isValid === false) {
          console.error(`[Flow] API validation returned isValid: false.`, validationResult);
          return {
            status: 'error',
            message: validationResult.message || 'Les données de l\'étudiant n\'ont pas pu être validées par l\'API.',
          };
      }

      console.log(`[Flow] API validation successful for matricule: ${input.matricule}`);

      return {
        status: 'success',
        message: 'Student data validated successfully by external API.',
      };

    } catch (error: any) {
      console.error('[Flow] An unexpected error occurred:', error);
      return {
        status: 'error',
        message: error.message || 'Une erreur inconnue est survenue durant le processus de validation.',
      };
    }
  }
);

    