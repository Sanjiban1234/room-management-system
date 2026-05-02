import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!serviceAccountBase64 || !projectId) {
  console.warn('Firebase connection missing FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID');
}

if (!getApps().length && serviceAccountBase64 && projectId) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON or initialize Firebase:', error);
  }
}

// Ensure we don't crash unconditionally if the app didn't initialize correctly
let db: any = null;
if (getApps().length > 0) {
  db = getFirestore();
} else {
  // Return a proxy that throws an error only when queries are actually made
  db = new Proxy({}, {
    get(target, prop) {
      throw new Error(`🔥 Firebase backend is not initialized properly. Please ensure FIREBASE_SERVICE_ACCOUNT_KEY in your .env contains the Base64-encoded version of your ENTIRE JSON file, not just the private key string.`);
    }
  });
}

export { db };
