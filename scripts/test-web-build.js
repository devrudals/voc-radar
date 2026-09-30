/**
 * Gate 5 Check: Production Web App Integrity & Assets Verification
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🧪 Running Gate 5: Production Web App Integrity & Assets Verification...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const requiredFiles = [
  'public/index.html',
  'public/style.css',
  'public/app.js',
  'src/server.js',
  'src/core/analyzer.js',
  'src/core/exporter.js',
  'src/core/license.js',
  'src/core/sanitize.js',
  'src/data/sample-presets.js'
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(fullPath), `Required file missing: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.ok(content.length > 50, `File appears empty: ${relPath}`);
}

// Verify index.html contains essential hooks
const html = fs.readFileSync(path.join(rootDir, 'public/index.html'), 'utf8');
assert.ok(html.includes('id="review-input"'), 'index.html must have review-input textarea');
assert.ok(html.includes('id="btn-analyze"'), 'index.html must have btn-analyze');
assert.ok(html.includes('id="results-panel"'), 'index.html must have results-panel');
assert.ok(html.includes('id="modal-pro"'), 'index.html must have modal-pro for LemonSqueezy payment');

console.log('✅ WEB_APP_VALIDATED');
process.exit(0);
