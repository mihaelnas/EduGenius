
'use server';
/**
 * @fileOverview Flow to validate a new student's information against an external API.
 * This flow ONLY performs validation and does not write to the database.
 *
 * - validateAndAssignStudent - The main function that handles the validation process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInputSchema, StudentValidationInput } from '@/lib/placeholder-data';
import { z } from 'zod';

// This flow no longer uses firebase-admin, so the initialization is removed.

// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  className: z.string().optional(), // The class name is returned on success
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;


/**
 * Main exported function that triggers the student validation flow.
 * @param input The student's data for validation.
 * @returns The result of the validation.
 */
export async function validateAndAssignStudent(input: StudentValidationInput): Promise<FlowOutput> {
  return studentValidationFlow(input);
}

// Define the Genkit flow for external validation
const studentValidationFlow = ai.defineFlow(
  {
    name: 'studentValidationFlow',
    inputSchema: StudentValidationInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting external validation for matricule: ${input.matricule}`);
    
    try {
      const fetch = (await import('node-fetch')).default;
      
      const apiRequestBody = {
        studentId: input.matricule,
        firstName: input.firstName,
        lastName: input.lastName,
      };

      console.log('[Flow] Preparing to send request to external API with body:', JSON.stringify(apiRequestBody));

      const validationResponse = await fetch('https://veri-genius.vercel.app/api/validate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequestBody),
      });

      if (!validationResponse.ok) {
          const errorText = await validationResponse.text();
          console.error(`[Flow] API validation failed with status ${validationResponse.status}:`, errorText);
          return {
            status: 'error',
            message: `La validation externe a échoué. (Status: ${validationResponse.status}).`,
          };
      }
      
      const validationResult = await validationResponse.json() as { isValid: boolean, className?: string, message?: string };
      
      console.log('[Flow] Received response from external API:', validationResult);

      if (validationResult.isValid === false || !validationResult.className) {
          console.error(`[Flow] API validation returned invalid or missing className.`, validationResult);
          return {
            status: 'error',
            message: validationResult.message || "L'API de validation n'a pas retourné de classe valide.",
          };
      }

      console.log(`[Flow] API validation successful. Received class: ${validationResult.className}`);
      
      // On success, return the success status and the class name.
      return {
        status: 'success',
        message: 'Student information validated successfully.',
        className: validationResult.className,
      };

    } catch (error: any) {
      console.error('[Flow] An unexpected error occurred during validation:', error);
      return {
        status: 'error',
        message: error.message || 'Une erreur inconnue est survenue durant le processus de validation.',
      };
    }
  }
);
