
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Helper function to initialize Firebase Admin SDK
function initializeAdminApp() {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // Otherwise, initialize the app. The SDK will automatically
  // find the credentials in a Google Cloud environment.
  return admin.initializeApp();
}

/**
 * Handles DELETE requests to delete a user from Firebase Authentication.
 * Route: /api/users/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  try {
    initializeAdminApp();
    await admin.auth().deleteUser(userId);
    return NextResponse.json({ success: true, message: `Successfully deleted user ${userId}` }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete auth user ${userId}:`, error);

    let errorMessage = 'The user could not be deleted.';
    let statusCode = 500;

    if (error.code === 'auth/user-not-found') {
      // This is not a critical error for our flow, as the user might have already been deleted from auth.
      // We can return success to allow the Firestore cleanup to proceed.
      return NextResponse.json({ success: true, message: 'Authentication user not found, proceeding with cleanup.' }, { status: 200 });
    } else if (error.code === 'auth/project-not-found') {
        errorMessage = 'Firebase project not found. Check server configuration.';
        statusCode = 500;
    }
    else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
  }
}
