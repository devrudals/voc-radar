/**
 * Master Unlazy Gates Runner
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const GATES = [
  { id: 'Gate 1', name: 'Review Sentiment & Pattern Mining Unit Tests', script: 'scripts/test-analyzer.js', expect: 'ALL_ANALYZER_TESTS_PASSED' },
  { id: 'Gate 2', name: 'Zero-Token Local-First Execution Verification', script: 'scripts/test-zero-token.js', expect: 'ZERO_TOKEN_ANALYSIS_SUCCESS' },
  { id: 'Gate 3', name: 'XSS Sanitization & LemonSqueezy License Security', script: 'scripts/test-license-security.js', expect: 'SECURITY_AND_LICENSE_VERIFIED' },
  { id: 'Gate 4', name: 'CSV & Notion/Sheets Export Engine Verification', script: 'scripts/test-export.js', expect: 'EXPORT_ENGINE_VERIFIED' },
  { id: 'Gate 5', name: 'Production Web App Integrity & Assets Verification', script: 'scripts/test-web-build.js', expect: 'WEB_APP_VALIDATED' },
  { id: 'Gate 6', name: 'Chrome Extension Manifest V3 Packaging Validation', script: 'scripts/test-extension.js', expect: 'EXTENSION_V3_VALIDATED' },
  { id: 'Gate 7', name: 'Cold-Start Multi-Channel Distribution Assets Complete', script: 'scripts/test-launch-kit.js', expect: 'LAUNCH_KIT_VERIFIED' }
];

console.log('════════════════════════════════════════════════════════════');
console.log('🚀 VOCRadar Unlazy Acceptance Gates Verification Runner');
console.log('════════════════════════════════════════════════════════════\n');

let allPassed = true;

for (const gate of GATES) {
  process.stdout.write(`▶ ${gate.id}: ${gate.name} ... `);
  try {
    const output = execSync(`node ${path.join(rootDir, gate.script)}`, { encoding: 'utf8' });
    if (output.includes(gate.expect)) {
      console.log('✅ PASSED');
    } else {
      console.log(`❌ FAILED (Expected: ${gate.expect})`);
      allPassed = false;
    }
  } catch (err) {
    console.log(`❌ FAILED (Exit Code != 0)`);
    console.error(err.stdout || err.message);
    allPassed = false;
  }
}

console.log('\n════════════════════════════════════════════════════════════');
if (allPassed) {
  console.log('🎉 ALL 7 GATES MET WITH EVIDENCE. SYSTEM FULLY CERTIFIED.');
  process.exit(0);
} else {
  console.log('⚠️ SOME GATES FAILED. REPAIRS REQUIRED.');
  process.exit(1);
}
