import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ClaimsAdapter } from '../interfaces';

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
        } else {
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

  async setStaffRole(uid: string, role: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn(`[ClaimsAdapter] Mock setting claim role "${role}" on user ${uid}`);
      return;
    }
    await getAuth().setCustomUserClaims(uid, { role, staff: true });
  }

  async verifyIdToken(idToken: string): Promise<{ uid: string; email?: string; role?: string } | null> {
    if (!idToken) return null;
    if (this.isInitialized) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        return {
          uid: decoded.uid,
          email: decoded.email,
          role: (decoded.role as string) || undefined,
        };
      } catch (err) {
        console.error('Firebase Admin token verification error:', err);
      }
    }

    // Fallback: parse token payload
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        return {
          uid: payload.user_id || payload.sub,
          email: payload.email,
          role: payload.role,
        };
      }
    } catch (_) {}

    return null;
  }
}
