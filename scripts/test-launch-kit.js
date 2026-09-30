/**
 * Gate 7 Check: Cold-Start Multi-Channel Distribution Assets Complete
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🧪 Running Gate 7: Cold-Start Multi-Channel Distribution Assets Verification...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const launchFiles = [
  'launch-kit/PRODUCT_HUNT.md',
  'launch-kit/REDDIT_PLAYBOOK.md',
  'launch-kit/TWITTER_VIRAL_THREAD.md',
  'launch-kit/COLD_EMAIL_TEMPLATES.md'
];

for (const file of launchFiles) {
  const fullPath = path.join(rootDir, file);
  assert.ok(fs.existsSync(fullPath), `Launch asset missing: ${file}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.ok(content.length > 200, `Launch asset content too short: ${file}`);
}

const ph = fs.readFileSync(path.join(rootDir, 'launch-kit/PRODUCT_HUNT.md'), 'utf8');
assert.ok(ph.includes('Maker First Comment'), 'Product Hunt kit must have Maker First Comment');

const reddit = fs.readFileSync(path.join(rootDir, 'launch-kit/REDDIT_PLAYBOOK.md'), 'utf8');
assert.ok(reddit.includes('r/FulfillmentByAmazon'), 'Reddit kit must target e-com subreddits');

console.log('✅ LAUNCH_KIT_VERIFIED');
process.exit(0);
