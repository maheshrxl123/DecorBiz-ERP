/**
 * DecorBiz Real Cloud Firestore Data Export Utility
 * PRD Section 17 & Implementation Plan
 * Exports live Firestore root collections and organization subcollections to JSON and per-collection CSV files.
 */
import fs from 'fs';
import path from 'path';
import type { Firestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin, serializeFirestoreValue } from './firebaseAdmin';

const ROOT_COLLECTIONS = [
  'business',
  'settings',
  'productLines',
  'categories',
  'products',
  'variants',
  'balances',
  'stockMoves',
  'parties',
  'bills',
  'quotations',
  'payments',
  'purchases',
  'expenses',
  'webOrders',
  'counters',
  'staff',
  'audit',
  'customers',
  'users',
  'organizations',
] as const;

const ORG_SUBCOLLECTIONS = [
  'stores',
  'staff',
  'roles',
  'products',
  'categories',
  'manufacturers',
  'taxes',
  'hsnCodes',
  'batches',
  'invoices',
  'quotations',
  'customers',
  'customerPayments',
  'suppliers',
  'purchaseOrders',
  'grns',
  'returns',
  'creditNotes',
  'supplierReturns',
  'warehouses',
  'stockTransfers',
  'auditLogs',
  'settings',
] as const;

function escapeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
  // Neutralize spreadsheet formula injection when exporting CSV
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCollectionCsv(filePath: string, docs: Record<string, Record<string, unknown>>) {
  const entries = Object.entries(docs);
  if (entries.length === 0) return;

  const keySet = new Set<string>(['__id']);
  for (const [, data] of entries) {
    Object.keys(data).forEach((k) => keySet.add(k));
  }
  const headers = Array.from(keySet);
  const lines = [headers.map(escapeCsvCell).join(',')];

  for (const [docId, data] of entries) {
    const row = headers.map((h) => (h === '__id' ? escapeCsvCell(docId) : escapeCsvCell(data[h])));
    lines.push(row.join(','));
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

export async function runFirestoreExport(dbOverride?: Firestore): Promise<{
  jsonPath: string;
  csvDir: string;
  totalDocuments: number;
}> {
  const db = dbOverride || initFirebaseAdmin().db;

  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvDir = path.join(exportDir, `csv_${timestamp}`);
  fs.mkdirSync(csvDir, { recursive: true });

  const collectionsPayload: Record<string, Record<string, Record<string, unknown>>> = {};
  const organizationSubcollections: Record<
    string,
    Record<string, Record<string, Record<string, unknown>>>
  > = {};

  let totalDocuments = 0;

  for (const colName of ROOT_COLLECTIONS) {
    const snap = await db.collection(colName).get();
    if (snap.empty) continue;

    const docsMap: Record<string, Record<string, unknown>> = {};
    snap.forEach((docSnap) => {
      docsMap[docSnap.id] = serializeFirestoreValue(docSnap.data()) as Record<string, unknown>;
      totalDocuments += 1;
    });

    collectionsPayload[colName] = docsMap;
    writeCollectionCsv(path.join(csvDir, `${colName}.csv`), docsMap);
  }

  // Export nested organization subcollections if multi-org records exist
  const orgIds = Object.keys(collectionsPayload.organizations || {});
  for (const orgId of orgIds) {
    organizationSubcollections[orgId] = {};
    for (const subCol of ORG_SUBCOLLECTIONS) {
      const snap = await db.collection('organizations').doc(orgId).collection(subCol).get();
      if (snap.empty) continue;

      const subDocs: Record<string, Record<string, unknown>> = {};
      snap.forEach((docSnap) => {
        subDocs[docSnap.id] = serializeFirestoreValue(docSnap.data()) as Record<string, unknown>;
        totalDocuments += 1;
      });

      organizationSubcollections[orgId][subCol] = subDocs;
      writeCollectionCsv(path.join(csvDir, `org_${orgId}_${subCol}.csv`), subDocs);
    }
  }

  const profileData = collectionsPayload.business?.profile || {};
  const firstOrg = orgIds.length > 0 ? collectionsPayload.organizations[orgIds[0]] : {};

  const exportDocument = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    business: {
      legalName: String(profileData.legalName || firstOrg.legalName || firstOrg.name || ''),
      tradeName: String(profileData.tradeName || firstOrg.name || ''),
      gstin: String(profileData.gstin || firstOrg.gstin || ''),
    },
    totalDocuments,
    collections: collectionsPayload,
    organizationSubcollections,
  };

  const jsonPath = path.join(exportDir, `decorbiz_export_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(exportDocument, null, 2), 'utf8');

  return { jsonPath, csvDir, totalDocuments };
}

// Run directly when executed via `npm run export`
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]).endsWith(path.join('scripts', 'export.ts'));

if (isDirectRun) {
  console.log('\n=========================================');
  console.log('      DecorBiz Firestore Data Export');
  console.log('=========================================\n');

  runFirestoreExport()
    .then(({ jsonPath, csvDir, totalDocuments }) => {
      console.log(`Exported ${totalDocuments} Firestore documents.`);
      console.log(`JSON backup: ${jsonPath}`);
      console.log(`CSV folder:  ${csvDir}\n`);
    })
    .catch((err) => {
      console.error('Export failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
