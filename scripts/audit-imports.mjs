import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');
let errorCount = 0;

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(srcDir);

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  // Match import statements: from '...' or from "..." or import('...')
  const importRegex = /(?:import\s+(?:[\s\S]*?from\s+)?|export\s+(?:[\s\S]*?from\s+)?|import\()\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Check only relative imports or alias imports
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      let resolvedBase = importPath.startsWith('@/')
        ? path.resolve(importPath.replace('@/', ''))
        : path.resolve(path.dirname(file), importPath);

      // Check extensions: .ts, .tsx, .d.ts, /index.ts, /index.tsx, .css, .json, or as is
      const candidates = [
        resolvedBase,
        resolvedBase + '.ts',
        resolvedBase + '.tsx',
        resolvedBase + '.d.ts',
        resolvedBase + '.json',
        resolvedBase + '.css',
        path.join(resolvedBase, 'index.ts'),
        path.join(resolvedBase, 'index.tsx'),
      ];

      const exists = candidates.some((c) => fs.existsSync(c) && !fs.statSync(c).isDirectory());
      if (!exists) {
        console.error(`❌ BROKEN IMPORT in ${path.relative(process.cwd(), file)}:`);
        console.error(`   Cannot resolve: "${importPath}"`);
        errorCount++;
      }
    }
  }
}

if (errorCount === 0) {
  console.log(`✅ All relative imports in ${allFiles.length} files resolved successfully!`);
} else {
  console.log(`Found ${errorCount} broken imports.`);
  process.exit(1);
}
