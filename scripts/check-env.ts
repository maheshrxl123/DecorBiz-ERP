/**
 * DecorBiz Environment Verification Script
 * PRD Section 2.4 & 2.5
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n=========================================');
console.log('   DecorBiz Environment Health Check');
console.log('=========================================\n');

const requiredBrowserVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_IMAGEKIT_URL_ENDPOINT',
  'VITE_IMAGEKIT_PUBLIC_KEY',
];

const requiredServerVars = [
  'IMAGEKIT_PRIVATE_KEY',
  'APP_ENCRYPTION_KEY',
];

let hasErrors = false;

console.log('[1] Checking Public Client Configuration (Browser)...');
for (const key of requiredBrowserVars) {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    console.warn(`  ⚠️  Missing or empty: ${key}`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${key} is configured`);
  }
}

console.log('\n[2] Checking Server Secrets Configuration (Adapter)...');
for (const key of requiredServerVars) {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    console.warn(`  ⚠️  Missing or empty: ${key}`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${key} is present`);
  }
}

console.log('\n[3] Optional Integrations...');
const optionalVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'SMTP_HOST', 'FIREBASE_SERVICE_ACCOUNT'];
for (const key of optionalVars) {
  const val = process.env[key];
  if (val) {
    console.log(`  ℹ️  ${key} is enabled`);
  } else {
    console.log(`  ⚪ ${key} is not set (optional)`);
  }
}

console.log('\n-----------------------------------------');
if (hasErrors) {
  console.log('Result: ⚠️ Some required configurations are missing.');
  console.log('Please update your .env file with your Firebase / ImageKit credentials.\n');
  process.exit(1);
} else {
  console.log('Result: ✅ All core configurations are valid!\n');
  process.exit(0);
}
