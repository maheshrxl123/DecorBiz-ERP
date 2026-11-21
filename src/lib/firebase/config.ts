import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration
 * Sourced securely from Vite environment variables (VITE_FIREBASE_*)
 * PRD Section 2.4
 */
export const firebaseConfig = {
  apiKey: (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || '',
  authDomain: (import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || '',
  projectId: (import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || '',
  storageBucket: (import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: (import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: (import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || '',
};

export const firestoreDatabaseId = '(default)';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

/**
 * Get or initialize Firebase App instance with lazy initialization
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
}

/**
 * Get Firebase Firestore Database instance
 */
export function getFirestoreDb(): Firestore {
  if (!firestoreInstance) {
    const app = getFirebaseApp();
    if (firestoreDatabaseId && firestoreDatabaseId !== '(default)') {
      firestoreInstance = getFirestore(app, firestoreDatabaseId);
    } else {
      firestoreInstance = getFirestore(app);
    }
  }
  return firestoreInstance;
}

export const db = getFirestoreDb();

async function testConnection(retryCount = 0) {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      if (retryCount < 2) {
        setTimeout(() => testConnection(retryCount + 1), 1000);
        return;
      }
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();
