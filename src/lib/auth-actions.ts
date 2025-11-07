
import { Auth, sendPasswordResetEmail } from 'firebase/auth';

/**
 * Sends a password reset email to a user.
 * This is a wrapper around the Firebase SDK function.
 *
 * @param auth The Firebase Auth instance.
 * @param email The email address of the user to send the reset link to.
 */
export async function sendPasswordReset(auth: Auth, email: string): Promise<void> {
  // The Firebase SDK handles all the logic of sending the email.
  // This function will throw an error if the email is not found or if there's
  // another issue (e.g., network error), which should be caught by the caller.
  await sendPasswordResetEmail(auth, email);
}
