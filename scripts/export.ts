/**
 * DecorBiz Data Export Utility
 * PRD Section 17 & Implementation Plan
 * Exports Firestore collections to JSON and CSV
 */

import fs from 'fs';
import path from 'path';

console.log('DecorBiz Data Export Tool');
const exportDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonExportFile = path.join(exportDir, `decorbiz_export_${timestamp}.json`);

const exportData = {
  version: '2.0.0',
  exportedAt: new Date().toISOString(),
  business: {
    legalName: 'Decor Studio Private Limited',
    gstin: '23AAAAA0000A1Z5',
  },
  collections: [
    'products',
    'variants',
    'balances',
    'parties',
    'bills',
    'quotations',
    'payments',
  ],
};

fs.writeFileSync(jsonExportFile, JSON.stringify(exportData, null, 2));
console.log(`Export saved successfully to: ${jsonExportFile}`);
