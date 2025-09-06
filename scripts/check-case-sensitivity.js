#!/usr/bin/env node
/**
 * Check for case-sensitivity issues that could cause production deployment problems
 * on Linux/Vercel when developing on macOS
 */
import { readdir } from 'fs/promises';
import { join } from 'path';

const problematicPatterns = [
  { pattern: /index\./i, dir: 'src' },
  { pattern: /Index\./i, dir: 'src' },
];

async function checkCaseSensitivity() {
  let issues = 0;

  try {
    // Check for conflicting index files
    const files = await getAllFiles('src');
    const indexFiles = files.filter(
      (file) => file.toLowerCase().includes('index.') || file.toLowerCase().includes('Index.'),
    );

    if (indexFiles.length > 0) {
      console.log('Found index files:');
      indexFiles.forEach((file) => console.log(`  ${file}`));

      // Check for potential conflicts
      const lowercaseNames = indexFiles.map((f) => f.toLowerCase());
      const uniqueNames = [...new Set(lowercaseNames)];

      if (lowercaseNames.length !== uniqueNames.length) {
        console.error('❌ Case-sensitivity conflict detected!');
        issues++;
      } else {
        console.log('✅ No case conflicts found');
      }
    }

    return issues;
  } catch (error) {
    console.error('Error checking case sensitivity:', error);
    return 1;
  }
}

async function getAllFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// Run check
checkCaseSensitivity().then((issues) => {
  if (issues > 0) {
    console.error(`❌ Found ${issues} case-sensitivity issues`);
    process.exit(1);
  } else {
    console.log('✅ Case-sensitivity check passed');
    process.exit(0);
  }
});
