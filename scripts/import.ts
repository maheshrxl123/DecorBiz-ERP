/**
 * DecorBiz Data Restore/Import Utility
 * PRD Section 17
 * Requires typing the business name before restoring
 */

import readline from 'readline';

console.log('\n=========================================');
console.log('       DecorBiz Data Restore Tool');
console.log('=========================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Type the exact legal business name to confirm restore: ', (answer) => {
  if (answer.trim() === 'Decor Studio Private Limited') {
    console.log('Verification successful. Ready to restore database.');
  } else {
    console.log('Business name does not match. Restore aborted for safety.');
  }
  rl.close();
});
