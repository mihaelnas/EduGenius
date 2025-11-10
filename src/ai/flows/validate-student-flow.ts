'use server';
/**
 * @fileOverview Flow to validate a new student against an external API and assign them to a class.
 *
 * - validateAndAssignStudent - A function that handles the student validation and assignment process.
 */

import { ai } from '@/ai/genkit';
import { StudentValidationInput, StudentValidationInputSchema } from '@/lib/placeholder-data';
import { z } from 'zod';

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
        // The flow fails, but the user is not notified directly. The user remains pending.
        return {
          status: 'error',
          message: `Validation API failed: ${errorBody.message || 'Unknown API error'}`,
          classId: undefined
        };
      }
      
      const validationResult = await validationResponse.json();
      console.log(`[Flow] API validation successful for user: ${input.userId}`, validationResult);

      // IMPORTANT: The flow now simply returns success. The front-end or another
      // administrative action will be responsible for updating the user status and class.
      // This flow's only job is to validate and return the result.
      return {
        status: 'success',
        message: 'Student successfully validated by the external API.',
        // We are not assigning a class here anymore.
        classId: undefined
      };

    } catch (error) {
      console.error('[Flow] Error calling validation API:', error);
      // The user remains pending, this is a silent failure for the user but logged for the admin.
      return {
        status: 'error',
        message: 'External API call failed. User remains pending.',
        classId: undefined
      };
    }
  }
);
