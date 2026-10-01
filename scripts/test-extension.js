/**
 * Gate 6 Check: Chrome Extension Manifest V3 Packaging Validation
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🧪 Running Gate 6: Chrome Extension Manifest V3 Packaging Validation...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const manifestPath = path.join(rootDir, 'extension/manifest.json');
assert.ok(fs.existsSync(manifestPath), 'extension/manifest.json must exist');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
assert.ok(manifest.name.includes('VOCRadar'), 'Manifest name should identify VOCRadar');
assert.ok(manifest.permissions.includes('activeTab'), 'Must include activeTab permission');
assert.ok(manifest.content_scripts && manifest.content_scripts.length > 0, 'Must define content scripts');

assert.ok(manifest.icons && manifest.icons['128'], 'Must define 128px icon for Chrome Web Store');

// Verify extension scripts and icons exist
assert.ok(fs.existsSync(path.join(rootDir, 'extension/content.js')), 'content.js must exist');
assert.ok(fs.existsSync(path.join(rootDir, 'extension/popup.html')), 'popup.html must exist');
assert.ok(fs.existsSync(path.join(rootDir, 'extension/popup.js')), 'popup.js must exist');
assert.ok(fs.existsSync(path.join(rootDir, 'extension/icons/icon-128.png')), 'icon-128.png must exist');
assert.ok(fs.existsSync(path.join(rootDir, 'extension/icons/icon-48.png')), 'icon-48.png must exist');
assert.ok(fs.existsSync(path.join(rootDir, 'extension/icons/icon-16.png')), 'icon-16.png must exist');

console.log('✅ EXTENSION_V3_VALIDATED');
process.exit(0);
