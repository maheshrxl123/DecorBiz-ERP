import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ClaimsAdapter } from '../interfaces';

export const ALLOWED_STAFF_ROLES = new Set([
  'owner',
  'admin',
  'manager',
  'sales_staff',
  'cashier',
  'storekeeper',
  'accountant',
  'viewer',
  'website_manager',
  'delivery_staff',
  'staff',
]);

function parseServiceAccountEnv(rawValue?: string): Record<string, any> | null {
  if (!rawValue) return null;
  let trimmed = rawValue.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed || !trimmed.startsWith('{')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && (parsed.project_id || parsed.client_email)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export class FirebaseClaimsAdapter implements ClaimsAdapter {
  private isInitialized = false;

  constructor() {
    if (!getApps().length) {
      try {
        const serviceAccount = parseServiceAccountEnv(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount) {
          initializeApp({
            credential: cert(serviceAccount),
          });
          this.isInitialized = true;
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
          initializeApp();
          this.isInitialized = true;
        }
      } catch (err) {
        console.warn('Firebase Admin SDK could not initialize automatically:', err);
      }
    } else {
      this.isInitialized = true;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async setStaffRole(uid: string, role: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Firebase Admin SDK is not configured on the server.');
    }
    if (!uid || typeof uid !== 'string') {
      throw new Error('Valid target user UID is required.');
    }
    if (!ALLOWED_STAFF_ROLES.has(role)) {
      throw new Error(`Invalid staff role: ${role}`);
    }
    await getAuth().setCustomUserClaims(uid, { role, staff: true });
  }

  async verifyIdToken(idToken: string): Promise<{ uid: string; email?: string; role?: string } | null> {
    if (!idToken || typeof idToken !== 'string' || !this.isInitialized) {
      return null;
    }
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        role: typeof decoded.role === 'string' ? decoded.role : undefined,
      };
    } catch (err) {
      console.error('Firebase Admin token verification error:', err);
      return null;
    }
  }

  async isCallerOrgAdminOrOwner(
    caller: { uid: string; role?: string },
    organizationId?: string
  ): Promise<boolean> {
    if (caller.role === 'owner' || caller.role === 'admin') {
      return true;
    }
    if (!this.isInitialized || !organizationId || typeof organizationId !== 'string') {
      return false;
    }
    try {
      const staffSnap = await getFirestore()
        .doc(`organizations/${organizationId}/staff/${caller.uid}`)
        .get();
      if (!staffSnap.exists) return false;
      const data = staffSnap.data();
      return data?.status === 'active' && (data?.roleId === 'owner' || data?.roleId === 'admin');
    } catch (err) {
      console.error('Failed to verify caller org admin membership:', err);
      return false;
    }
  }
}
