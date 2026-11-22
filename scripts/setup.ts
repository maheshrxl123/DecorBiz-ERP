/**
 * DecorBiz Real Cloud Firestore Setup & Seeding Script
 * PRD Section 2.5 & Section 3.3
 *
 * Usage:
 *   npm run setup -- --legal-name "Your Showroom Pvt Ltd" --trade-name "Your Showroom" --gstin "23AAAAA0000A1Z5" --city "Indore" --state "Madhya Pradesh" --owner-uid "<firebase-uid>"
 *
 * All business fields may also be passed via environment variables:
 *   SETUP_LEGAL_NAME, SETUP_TRADE_NAME, SETUP_GSTIN, SETUP_PHONE, SETUP_EMAIL,
 *   SETUP_ADDRESS, SETUP_CITY, SETUP_STATE, SETUP_PINCODE, SETUP_OWNER_UID
 */
import { FieldValue } from 'firebase-admin/firestore';
import { APP_CONFIG } from '../config/app.config';
import { getActiveModules } from '../config/modules.config';
import { initFirebaseAdmin } from './firebaseAdmin';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1].trim();
  }
  return undefined;
}

function slugifyId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

async function runSetup() {
  console.log('\n=========================================');
  console.log('      DecorBiz Firestore Setup & Seed');
  console.log('=========================================\n');

  const { db, auth, projectId } = initFirebaseAdmin();
  console.log(`Connected to Firebase project: ${projectId || '(default)'}`);

  const legalName = getArg('--legal-name') || process.env.SETUP_LEGAL_NAME?.trim() || '';
  const tradeName = getArg('--trade-name') || process.env.SETUP_TRADE_NAME?.trim() || legalName;
  const gstin = (getArg('--gstin') || process.env.SETUP_GSTIN?.trim() || '').toUpperCase();
  const phone = getArg('--phone') || process.env.SETUP_PHONE?.trim() || '';
  const email = getArg('--email') || process.env.SETUP_EMAIL?.trim() || '';
  const address = getArg('--address') || process.env.SETUP_ADDRESS?.trim() || '';
  const city = getArg('--city') || process.env.SETUP_CITY?.trim() || '';
  const state = getArg('--state') || process.env.SETUP_STATE?.trim() || '';
  const pincode = getArg('--pincode') || process.env.SETUP_PINCODE?.trim() || '';
  const ownerUid = getArg('--owner-uid') || process.env.SETUP_OWNER_UID?.trim() || '';

  const batch = db.batch();

  // 1. Seed / merge canonical business/profile only if explicit business values were provided
  const profileRef = db.doc('business/profile');
  const existingProfile = await profileRef.get();

  if (legalName || !existingProfile.exists) {
    if (!legalName && !existingProfile.exists) {
      console.log(
        'Note: No --legal-name provided and business/profile does not exist yet. Complete Showroom Setup in /create-workspace or pass --legal-name.'
      );
    } else if (legalName) {
      batch.set(
        profileRef,
        {
          legalName,
          tradeName: tradeName || legalName,
          gstin,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          currency: APP_CONFIG.defaultCurrency,
          timezone: 'Asia/Kolkata',
          defaultWastagePercent: APP_CONFIG.invoice.defaultTileWastagePercent,
          updatedAt: FieldValue.serverTimestamp(),
          ...(existingProfile.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true }
      );
      console.log(`Queued business/profile -> ${legalName}`);
    }
  } else {
    console.log(`Preserving existing business/profile (${existingProfile.data()?.legalName || 'configured'}).`);
  }

  // 2. Seed settings/modules with Simple Mode defaults (idempotent)
  const modulesRef = db.doc('settings/modules');
  const existingModules = await modulesRef.get();
  if (!existingModules.exists) {
    batch.set(modulesRef, {
      simpleMode: true,
      modules: getActiveModules(),
      updatedBy: ownerUid || 'cli-setup',
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('Queued settings/modules (Simple Mode = 8 core V1 modules)');
  } else {
    console.log('Preserving existing settings/modules.');
  }

  // 3. Seed settings/schema version tracker
  const schemaRef = db.doc('settings/schema');
  batch.set(
    schemaRef,
    {
      version: '2.0.0',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 4. Seed the 5 fixed PRD Product Lines
  for (const line of APP_CONFIG.productLines) {
    batch.set(
      db.doc(`productLines/${line.id}`),
      {
        id: line.id,
        nameEn: line.nameEn,
        nameHi: line.nameHi,
        defaultUnit: line.defaultUnit,
        isSystem: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  console.log(`Queued ${APP_CONFIG.productLines.length} canonical product lines.`);

  // 5. Seed Other/General Categories
  for (const catName of APP_CONFIG.generalSeededCategories) {
    const catId = `general_${slugifyId(catName)}`;
    batch.set(
      db.doc(`categories/${catId}`),
      {
        id: catId,
        name: catName,
        productLineId: 'general',
        isSystem: true,
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  console.log(`Queued ${APP_CONFIG.generalSeededCategories.length} Other/General categories.`);

  // 6. Initialize atomic invoice counters (CNT & WEB) if missing
  for (const counterId of [APP_CONFIG.invoice.counterPrefix, APP_CONFIG.invoice.websitePrefix]) {
    const counterRef = db.doc(`counters/${counterId}`);
    const snap = await counterRef.get();
    if (!snap.exists) {
      batch.set(counterRef, {
        prefix: counterId,
        nextSeq: 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Queued counters/${counterId} starting at 1.`);
    }
  }

  await batch.commit();

  // 7. Optional: Grant owner custom claim when --owner-uid is supplied
  if (ownerUid) {
    await auth.setCustomUserClaims(ownerUid, { role: 'owner' });
    await db.doc(`staff/${ownerUid}`).set(
      {
        uid: ownerUid,
        role: 'owner',
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`Assigned custom claim role="owner" and staff/${ownerUid} record.`);
  }

  console.log('\nDecorBiz Firestore setup completed successfully.');
}

runSetup().catch((err) => {
  console.error('Setup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
