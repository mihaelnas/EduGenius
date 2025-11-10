
'use server';
/**
 * @fileOverview Flow to validate a new student against an external API.
 * This flow ONLY validates the student data via the API and returns the result.
 * It does not modify the database.
 *
 * - validateAndAssignStudent - A function that handles the student validation process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInput } from '@/lib/placeholder-data';
import { z } from 'zod';

// We only need a subset of the full student validation input for the API call
const ApiValidationSchema = z.object({
  matricule: z.string().describe("The student's registration ID."),
  firstName: z.string().describe("The student's first name."),
  lastName: z.string().describe("The student's last name."),
});

// Define the output schema for the flow
const FlowOutputSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;


/**
 * Main exported function that triggers the student validation flow.
 * This is called from the registration page.
 * @param input The student's data for API validation.
 * @returns The result of the flow execution.
 */
export async function validateAndAssignStudent(input: z.infer<typeof ApiValidationSchema>): Promise<FlowOutput> {
  return studentValidationFlow(input);
}

// Define the Genkit flow
const studentValidationFlow = ai.defineFlow(
  {
    name: 'studentValidationFlow',
    inputSchema: ApiValidationSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input) => {
    console.log(`[Flow] Starting API validation for matricule: ${input.matricule}`);
    
    try {
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

      if (!validationResponse.ok || validationResult.isValid === false) {
        console.error(`[Flow] API validation failed with status ${validationResponse.status}:`, validationResult);
        const errorMessage = validationResult.message || 'La validation des données avec le service externe a échoué.';
        return {
          status: 'error',
          message: `Validation externe échouée : ${errorMessage}`,
        };
      }
      
      console.log(`[Flow] API validation successful for matricule: ${input.matricule}`, validationResult);

      // 2. Return success if API call was successful
      return {
        status: 'success',
        message: 'Student successfully validated with external API.',
      };

    } catch (error) {
      console.error('[Flow] An unexpected error occurred during API call:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue durant la validation externe.',
      };
    }
  }
);
