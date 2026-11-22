import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getFirestoreDb } from '../lib/firebase/config';
import { FirestoreUser } from '../types/firestore';
import { validateFirestoreUser } from '../lib/firebase/validators';
import { sanitizeFirestorePayload } from '../lib/firebase/queryUtils';

/**
 * Normalizes a Firestore User document snapshot into a FirestoreUser
 */
function fromFirestoreDoc(snapshot: DocumentSnapshot): FirestoreUser | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const user: FirestoreUser = {
    uid: snapshot.id,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    phoneNumber: data.phoneNumber ?? null,
    primaryOrganizationId: data.primaryOrganizationId ?? null,
    status: data.status || 'active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt ?? null,
  };

  if (!validateFirestoreUser(user)) {
    console.warn(`User document validation failed for UID: ${snapshot.id}`);
  }
  return user;
}

export const userService = {
  /**
   * Fetch user profile from /users/{uid}
   */
  async getUserProfile(uid: string): Promise<FirestoreUser | null> {
    if (!uid) return null;
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userDocRef);
    return fromFirestoreDoc(snapshot);
  },

  /**
   * Create or synchronize a user profile at /users/{uid}
   * Zero authorization authority. primaryOrganizationId is purely a UI workspace preference.
   */
  async createUserProfile(
    uid: string,
    data: {
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
      phoneNumber?: string | null;
      accountType?: 'staff' | 'customer';
      primaryOrganizationId?: string | null;
    }
  ): Promise<FirestoreUser> {
    if (!uid) {
      throw new Error('User ID is required to initialize user profile.');
    }

    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userDocRef);

    if (!existingSnap.exists()) {
      const createPayload = sanitizeFirestorePayload({
        uid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        phoneNumber: data.phoneNumber ?? null,
        accountType: data.accountType ?? 'staff',
        primaryOrganizationId: data.primaryOrganizationId ?? null,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      await setDoc(userDocRef, createPayload);
      const snapshot = await getDoc(userDocRef);
      const profile = fromFirestoreDoc(snapshot);
      if (profile) return profile;

      return {
        uid,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        phoneNumber: data.phoneNumber ?? null,
        primaryOrganizationId: data.primaryOrganizationId ?? null,
        status: 'active',
      };
    }

    const updateFields: Record<string, any> = {
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    if (data.displayName !== undefined) updateFields.displayName = data.displayName;
    if (data.photoURL !== undefined) updateFields.photoURL = data.photoURL;
    if (data.phoneNumber !== undefined) updateFields.phoneNumber = data.phoneNumber;
    if (data.primaryOrganizationId !== undefined) {
      updateFields.primaryOrganizationId = data.primaryOrganizationId;
    }
    if (data.accountType !== undefined) {
      updateFields.accountType = data.accountType;
    }

    await updateDoc(userDocRef, sanitizeFirestorePayload(updateFields));
    const snapshot = await getDoc(userDocRef);
    const profile = fromFirestoreDoc(snapshot);
    if (profile) return profile;

    return {
      uid,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      photoURL: data.photoURL ?? null,
      phoneNumber: data.phoneNumber ?? null,
      primaryOrganizationId: data.primaryOrganizationId ?? null,
      status: 'active',
    };
  },

  /**
   * Update user profile editable fields
   */
  async updateUserProfile(
    uid: string,
    data: {
      displayName?: string | null;
      photoURL?: string | null;
      phoneNumber?: string | null;
      primaryOrganizationId?: string | null;
    }
  ): Promise<void> {
    if (!uid) throw new Error('User ID is required to update profile.');
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', uid);

    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    if (data.displayName !== undefined) payload.displayName = data.displayName;
    if (data.photoURL !== undefined) payload.photoURL = data.photoURL;
    if (data.phoneNumber !== undefined) payload.phoneNumber = data.phoneNumber;
    if (data.primaryOrganizationId !== undefined) {
      payload.primaryOrganizationId = data.primaryOrganizationId;
    }

    await updateDoc(userDocRef, sanitizeFirestorePayload(payload));
  },
};
