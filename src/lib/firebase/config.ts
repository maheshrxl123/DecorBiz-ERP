import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

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

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

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
