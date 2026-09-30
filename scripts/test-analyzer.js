/**
 * Gate 1 Check: Review Analyzer & Pattern Mining Unit Tests
 */

import assert from 'assert';
import { analyzeReviews, normalizeReviews } from '../src/core/analyzer.js';
import { SAMPLE_PRESETS } from '../src/data/sample-presets.js';

console.log('🧪 Running Gate 1: Review Sentiment & Pattern Mining Unit Tests...');

// 1. Normalization Test
const rawString = "Review 1: Sound is great.\n\nReview 2: Battery died after 2 days.<script>alert(1)</script>\n\nReview 3: Too big.";
const normalized = normalizeReviews(rawString);
assert.strictEqual(normalized.length, 3, 'Should normalize into 3 distinct reviews');
assert.ok(!normalized[1].includes('<script>'), 'HTML tags should be stripped during normalization');

// 2. Sample Presets Test: Earbuds
const earbudsReport = analyzeReviews(SAMPLE_PRESETS.earbuds.reviews);
assert.strictEqual(earbudsReport.status, 'SUCCESS');
assert.ok(earbudsReport.totalReviews >= 15, 'Total reviews should match preset');
assert.ok(earbudsReport.fatalFlaws.length > 0, 'Should detect fatal flaws');

// Check battery flaw detection
const hasBattery = earbudsReport.fatalFlaws.some(f => f.id === 'BATTERY_POWER');
assert.ok(hasBattery, 'Should detect Battery flaw in earbuds');

// Check desire pattern detection
assert.ok(earbudsReport.unmetDesires.length > 0, 'Should extract unmet desires');

// Check ad hook extraction
assert.ok(earbudsReport.adAngles.length > 0, 'Should extract ad angles');

// 3. Opportunity Score Range Test
assert.ok(earbudsReport.opportunityScore >= 1 && earbudsReport.opportunityScore <= 100, 'Score must be between 1 and 100');

console.log('✅ ALL_ANALYZER_TESTS_PASSED');
process.exit(0);
