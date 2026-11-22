/**
 * DecorBiz Real Cloud Firestore Migration & Upgrade Utility
 * PRD Section 16.1
 * 1. Runs a real pre-upgrade Firestore backup export
 * 2. Reads settings/schema version from Cloud Firestore
 * 3. Applies idempotent V2.0.0 migrations (settings/modules, counters/CNT, counters/WEB, schema version)
 * 4. Writes an append-only upgrade audit entry
 */
import { FieldValue } from 'firebase-admin/firestore';
import { APP_CONFIG } from '../config/app.config';
import { getActiveModules } from '../config/modules.config';
import { initFirebaseAdmin } from './firebaseAdmin';
import { runFirestoreExport } from './export';

const TARGET_SCHEMA_VERSION = '2.0.0';

async function runUpgrade() {
  console.log('\n=========================================');
  console.log('      DecorBiz Firestore Upgrade Tool');
  console.log('=========================================\n');

  const { db, projectId } = initFirebaseAdmin();
  console.log(`Connected to Firebase project: ${projectId || '(default)'}`);

  // 1. Pre-upgrade real backup
  console.log('1. Creating live pre-upgrade Firestore backup...');
  const backup = await runFirestoreExport(db);
  console.log(`   Backup saved (${backup.totalDocuments} docs): ${backup.jsonPath}`);

  // 2. Inspect current schema version
  console.log('2. Checking Firestore schema version...');
  const schemaRef = db.doc('settings/schema');
  const schemaSnap = await schemaRef.get();
  const currentVersion = String(schemaSnap.data()?.version || '1.0.0');
  console.log(`   Current schema version: ${currentVersion}`);

  // 3. Apply idempotent Version 2.0.0 migrations
  console.log(`3. Applying idempotent migrations to ${TARGET_SCHEMA_VERSION}...`);
  const appliedSteps: string[] = [];
  const batch = db.batch();

  // 3a. Ensure settings/modules exists
  const modulesRef = db.doc('settings/modules');
  const modulesSnap = await modulesRef.get();
  if (!modulesSnap.exists) {
    batch.set(modulesRef, {
      simpleMode: true,
      modules: getActiveModules(),
      updatedBy: 'cli-upgrade',
      updatedAt: FieldValue.serverTimestamp(),
    });
    appliedSteps.push('initialized settings/modules (Simple Mode defaults)');
  }

  // 3b. Ensure canonical counters CNT & WEB exist
  for (const prefix of [APP_CONFIG.invoice.counterPrefix, APP_CONFIG.invoice.websitePrefix]) {
    const counterRef = db.doc(`counters/${prefix}`);
    const snap = await counterRef.get();
    if (!snap.exists) {
      batch.set(counterRef, {
        prefix,
        nextSeq: 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      appliedSteps.push(`initialized counters/${prefix}`);
    }
  }

  // 3c. Update settings/schema version record
  batch.set(
    schemaRef,
    {
      version: TARGET_SCHEMA_VERSION,
      previousVersion: currentVersion,
      lastBackupFile: backup.jsonPath,
      upgradedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  appliedSteps.push(`updated settings/schema -> ${TARGET_SCHEMA_VERSION}`);

  // 3d. Write append-only audit entry
  const auditRef = db.collection('audit').doc(`upgrade_${Date.now()}`);
  batch.set(auditRef, {
    action: 'system.upgrade',
    fromVersion: currentVersion,
    toVersion: TARGET_SCHEMA_VERSION,
    appliedSteps,
    backupFile: backup.jsonPath,
    actorUid: 'cli-upgrade',
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log('\nUpgrade complete. Applied steps:');
  for (const step of appliedSteps) {
    console.log(`  - ${step}`);
  }
  console.log('All existing business records preserved.\n');
}

runUpgrade().catch((err) => {
  console.error('Upgrade failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
