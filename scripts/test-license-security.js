/**
 * Gate 3 Check: XSS Sanitization & LemonSqueezy License Validation Security
 */

import assert from 'assert';
import { escapeHTML, sanitizeCSVCell, stripHTML } from '../src/core/sanitize.js';
import { LicenseManager } from '../src/core/license.js';

console.log('🧪 Running Gate 3: XSS Sanitization & License Validation Security...');

// 1. XSS Escaping Test
const xssPayload = '<script>alert("hack")</script><img src=x onerror=alert(1)>';
const escaped = escapeHTML(xssPayload);
assert.ok(!escaped.includes('<script>'), 'Must escape <script>');
assert.ok(escaped.includes('&lt;script&gt;'), 'Must replace with entities');

// 2. CSV Formula Injection Prevention Test
const dangerousCSV1 = '=cmd|\'/C calc\'!A0';
const dangerousCSV2 = '@SUM(1+1)';
const dangerousCSV3 = '+2+5';
const sanitized1 = sanitizeCSVCell(dangerousCSV1);
const sanitized2 = sanitizeCSVCell(dangerousCSV2);
const sanitized3 = sanitizeCSVCell(dangerousCSV3);

assert.ok(sanitized1.startsWith("\"'="), 'Dangerous = formula must be prepended with single quote');
assert.ok(sanitized2.startsWith("\"'@"), 'Dangerous @ formula must be prepended with single quote');
assert.ok(sanitized3.startsWith("\"'+"), 'Dangerous + formula must be prepended with single quote');

// 3. License Manager Activation Test
const lm = new LicenseManager('test_storage_key');
// Invalid key test
const invalidResult = await lm.activateLicense('INVALID-KEY-1234');
assert.strictEqual(invalidResult.valid, false, 'Invalid license format must be rejected');

// Valid offline key test
const validOfflineKey = 'VOC-PRO-8842-9912-1004';
const validResult = await lm.activateLicense(validOfflineKey);
assert.strictEqual(validResult.valid, true, 'Valid VOC-PRO key must activate successfully');
assert.strictEqual(validResult.tier, 'PRO');
assert.strictEqual(lm.isPro(), true, 'LicenseManager.isPro() should return true after activation');

console.log('✅ SECURITY_AND_LICENSE_VERIFIED');
process.exit(0);
