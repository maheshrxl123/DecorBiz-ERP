/**
 * DecorBiz Real Cloud Firestore Data Restore / Import Utility
 * PRD Section 17
 *
 * Security & Safety Safeguards:
 * - Confines backup file resolution strictly inside ./exports/
 * - Reads the live business legal name from Cloud Firestore (never hardcoded)
 * - Requires typing the exact live business legal name before writing any documents
 * - Writes in chunked Firestore batches (<= 400 operations per batch)
 *
 * Usage:
 *   npm run import -- --file decorbiz_export_2026-01-01T00-00-00-000Z.json
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { initFirebaseAdmin, deserializeFirestoreValue } from './firebaseAdmin';

interface BackupPayload {
  version: string;
  exportedAt: string;
  business?: {
    legalName?: string;
    tradeName?: string;
    gstin?: string;
  };
  collections?: Record<string, Record<string, Record<string, unknown>>>;
  organizationSubcollections?: Record<
    string,
    Record<string, Record<string, Record<string, unknown>>>
  >;
}

function getFileArg(): string {
  const flagIdx = process.argv.indexOf('--file');
  const candidate =
    flagIdx !== -1 && flagIdx + 1 < process.argv.length
      ? process.argv[flagIdx + 1]
      : process.argv[2];

  if (!candidate) {
    throw new Error('Missing backup filename. Usage: npm run import -- --file <filename-in-exports.json>');
  }
  return candidate.trim();
}

function resolveSafeExportFile(fileArg: string): string {
  const exportsRoot = path.resolve(process.cwd(), 'exports');
  const candidatePath = path.resolve(exportsRoot, path.basename(fileArg));

  if (!candidatePath.startsWith(exportsRoot + path.sep)) {
    throw new Error('Invalid backup path: backup files must reside inside the exports/ directory.');
  }
  if (!candidatePath.endsWith('.json')) {
    throw new Error('Invalid backup file: only .json backup archives created by `npm run export` are supported.');
  }
  if (!fs.existsSync(candidatePath)) {
    throw new Error(`Backup file not found inside exports/: ${path.basename(fileArg)}`);
  }
  return candidatePath;
}

function promptLine(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runImport() {
  console.log('\n=========================================');
  console.log('     DecorBiz Firestore Data Restore');
  console.log('=========================================\n');

  const backupPath = resolveSafeExportFile(getFileArg());
  const rawJson = fs.readFileSync(backupPath, 'utf8');
  const payload = JSON.parse(rawJson) as BackupPayload;

  if (!payload || typeof payload !== 'object' || !payload.collections) {
    throw new Error('Backup JSON is invalid or missing the collections payload.');
  }

  const { db } = initFirebaseAdmin();

  // Fetch the live business legal name from Cloud Firestore (no hardcoded strings)
  let expectedBusinessName = '';
  const profileSnap = await db.doc('business/profile').get();
  if (profileSnap.exists) {
    expectedBusinessName = String(
      profileSnap.data()?.legalName || profileSnap.data()?.tradeName || ''
    ).trim();
  }

  if (!expectedBusinessName) {
    const orgsSnap = await db.collection('organizations').limit(1).get();
    if (!orgsSnap.empty) {
      const orgData = orgsSnap.docs[0].data();
      expectedBusinessName = String(orgData.legalName || orgData.name || '').trim();
    }
  }

  if (!expectedBusinessName) {
    expectedBusinessName = String(
      payload.business?.legalName || payload.business?.tradeName || ''
    ).trim();
  }

  if (!expectedBusinessName) {
    throw new Error(
      'Unable to determine the live business legal name from Firestore or backup metadata. Aborting restore.'
    );
  }

  console.log(`Backup file:      ${path.basename(backupPath)}`);
  console.log(`Backup timestamp: ${payload.exportedAt || 'unknown'}`);
  console.log(`Target business:  ${expectedBusinessName}\n`);

  const typedName = await promptLine(
    'Type the exact legal business name shown above to confirm restore: '
  );

  if (typedName !== expectedBusinessName) {
    console.log('\nBusiness name did not match. Restore aborted safely without modifying Firestore.');
    process.exit(1);
  }

  const operations: Array<{ path: string; data: Record<string, unknown> }> = [];

  for (const [colName, docsMap] of Object.entries(payload.collections || {})) {
    for (const [docId, docData] of Object.entries(docsMap || {})) {
      operations.push({
        path: `${colName}/${docId}`,
        data: deserializeFirestoreValue(docData) as Record<string, unknown>,
      });
    }
  }

  for (const [orgId, subMap] of Object.entries(payload.organizationSubcollections || {})) {
    for (const [subCol, docsMap] of Object.entries(subMap || {})) {
      for (const [docId, docData] of Object.entries(docsMap || {})) {
        operations.push({
          path: `organizations/${orgId}/${subCol}/${docId}`,
          data: deserializeFirestoreValue(docData) as Record<string, unknown>,
        });
      }
    }
  }

  const BATCH_LIMIT = 400;
  let restoredCount = 0;

  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const chunk = operations.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const op of chunk) {
      batch.set(db.doc(op.path), op.data, { merge: true });
    }
    await batch.commit();
    restoredCount += chunk.length;
    console.log(`Restored ${restoredCount}/${operations.length} documents...`);
  }

  console.log(`\nRestore complete. ${restoredCount} documents written to Cloud Firestore.\n`);
}

runImport().catch((err) => {
  console.error('Restore failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
