// IMPORTANT: This file should not be imported into client-side code.
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

// This function ensures that we initialize the app only once.
function initializeAdminApp() {
  if (getApps().some(app => app.name === '[DEFAULT]')) {
    return getApps()[0];
  }
  
  // In a deployed Google Cloud environment (like App Hosting), the SDK discovers credentials automatically.
  // We simply call initializeApp() without arguments.
  return initializeApp();
}

app = initializeAdminApp();
db = getFirestore(app);

export { db, app as adminApp };
