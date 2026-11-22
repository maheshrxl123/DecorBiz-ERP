/**
 * Shared Firebase Admin initializer for DecorBiz Operational CLI Scripts.
 * Reads credentials from FIREBASE_SERVICE_ACCOUNT (JSON string or path to service account JSON),
 * GOOGLE_APPLICATION_CREDENTIALS, or Application Default Credentials.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

export interface AdminContext {
  app: App;
  db: Firestore;
  auth: Auth;
  projectId: string;
}

export function initFirebaseAdmin(): AdminContext {
  const existing = getApps();
  if (existing.length > 0) {
    const app = existing[0];
    return {
      app,
      db: getFirestore(app),
      auth: getAuth(app),
      projectId: String(app.options.projectId || process.env.VITE_FIREBASE_PROJECT_ID || ''),
    };
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    undefined;

  let app: App;

  if (serviceAccountRaw) {
    let parsed: Record<string, unknown>;
    if (serviceAccountRaw.startsWith('{')) {
      parsed = JSON.parse(serviceAccountRaw);
    } else {
      const resolvedPath = path.resolve(process.cwd(), serviceAccountRaw);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT file not found at ${resolvedPath}. Provide a valid JSON string or service account file path.`
        );
      }
      parsed = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    }

    app = initializeApp({
      credential: cert(parsed as any),
      projectId: (parsed.project_id as string | undefined) || projectId,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } else {
    throw new Error(
      'Firebase Admin credentials not configured. Set FIREBASE_SERVICE_ACCOUNT (JSON or file path) or GOOGLE_APPLICATION_CREDENTIALS before running operational CLI scripts.'
    );
  }

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
    projectId: String(app.options.projectId || projectId || ''),
  };
}

/**
 * Recursively serializes Firestore Timestamps and nested objects for portable JSON backups.
 */
export function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') {
    const maybeTs = value as { toDate?: () => Date; _seconds?: number; _nanoseconds?: number };
    if (typeof maybeTs.toDate === 'function') {
      return { __type: 'Timestamp', iso: maybeTs.toDate().toISOString() };
    }
    if (Array.isArray(value)) {
      return value.map(serializeFirestoreValue);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeFirestoreValue(v);
    }
    return out;
  }
  return value;
}

/**
 * Restores serialized Timestamp markers back into JS Date instances for Firestore Admin writes.
 */
export function deserializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    if (rec.__type === 'Timestamp' && typeof rec.iso === 'string') {
      const dt = new Date(rec.iso);
      return Number.isNaN(dt.getTime()) ? rec.iso : dt;
    }
    if (Array.isArray(value)) {
      return value.map(deserializeFirestoreValue);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      out[k] = deserializeFirestoreValue(v);
    }
    return out;
  }
  return value;
}
