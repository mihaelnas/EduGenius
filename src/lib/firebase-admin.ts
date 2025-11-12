'use client';
// IMPORTANT: This file should not be imported into client-side code.
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

if (getApps().length === 0) {
  // In a deployed Google Cloud environment (like Cloud Run, Cloud Functions, App Hosting),
  // the SDK automatically discovers service account credentials.
  // We call initializeApp() without arguments.
  app = initializeApp();
} else {
  // In a local development environment, you may need to use a service account file.
  // This logic handles both cases.
  app = getApps()[0];
}

db = getFirestore(app);

export { db, app as adminApp };
