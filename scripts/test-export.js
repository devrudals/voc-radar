/**
 * Gate 4 Check: CSV & Markdown Export Engine Verification
 */

import assert from 'assert';
import { analyzeReviews } from '../src/core/analyzer.js';
import { exportToCSV, exportToMarkdown } from '../src/core/exporter.js';
import { SAMPLE_PRESETS } from '../src/data/sample-presets.js';

console.log('🧪 Running Gate 4: CSV & Markdown Export Engine Verification...');

const report = analyzeReviews(SAMPLE_PRESETS.bottle.reviews);
assert.strictEqual(report.status, 'SUCCESS');

// 1. CSV Generation Test
const csv = exportToCSV(report);
assert.ok(csv.length > 100, 'CSV output should not be empty');
assert.ok(csv.includes('Section,Category / Item,Metric / Frequency'), 'CSV should contain standard header');
assert.ok(csv.includes('Fatal Flaws'), 'CSV should contain Fatal Flaws section');
assert.ok(csv.includes('Opportunity Score'), 'CSV should contain Opportunity score');

// 2. Markdown Generation Test
const md = exportToMarkdown(report);
assert.ok(md.includes('# 📊 VOCRadar Intelligence Report'), 'Markdown should contain title');
assert.ok(md.includes('치명적 결함 TOP'), 'Markdown should contain flaws section');
assert.ok(md.includes('공장/제조사 전달용 스펙 개선'), 'Markdown should contain factory checklist');

console.log('✅ EXPORT_ENGINE_VERIFIED');
process.exit(0);
