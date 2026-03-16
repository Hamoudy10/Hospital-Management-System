/* eslint-disable no-console */
// scripts/performance-check.js
// Simple script to check bundle sizes and performance issues

const fs = require('fs');
const path = require('path');

console.log('📊 Performance Check');
console.log('===================');
console.log('Checking for large files and potential bottlenecks...\n');

// Check large component files
const largeFiles = [];
const checkDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isFile() && stats.size > 10000) { // >10KB
        largeFiles.push({ path: fullPath, size: stats.size });
      }
    } catch {
      // Skip files we can't read
    }
  });
};

// Check key directories
checkDir('app');
checkDir('components');
checkDir('features');

console.log(`Found ${largeFiles.length} large files (>10KB):`);
largeFiles.sort((a, b) => b.size - a.size).forEach((file) => {
  console.log(`  ${file.path.replace(process.cwd(), '.')} - ${(file.size / 1024).toFixed(2)}KB`);
});

// Check for common performance issues
console.log('\n🔍 Common Performance Issues:');
console.log('============================');

// Check if there are Promise.all calls in pages
const checkPromiseAll = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('Promise.all([')) {
      console.log(`⚠️  Found Promise.all in: ${filePath.replace(process.cwd(), '.')}`);
    }
  } catch {
    // Skip files we can't read
  }
};

// Check main pages
const pageFiles = [
  'app/(dashboard)/students/page.tsx',
  'app/(dashboard)/attendance/page.tsx',
  'app/(dashboard)/dashboard/page.tsx',
];

pageFiles.forEach(checkPromiseAll);

console.log('\n✅ Performance check complete!');
console.log('\nRecommendations:');
console.log('1. Consider code splitting for files >20KB');
console.log('2. Use dynamic imports for modals and heavy components');
console.log('3. Stagger API calls instead of Promise.all');
console.log('4. Implement proper loading states');


