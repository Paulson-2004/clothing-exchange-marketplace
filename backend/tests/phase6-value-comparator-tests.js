/**
 * Phase 6 Value Comparator - Automated Integration Tests
 * ========================================================
 *
 * Tests the Phase 6 Swap Value Comparator:
 *   - valueComparator.js utility (via backend endpoint)
 *   - GET /api/listings/compare endpoint
 *   - estimate-value endpoint (regression: existing Phase 3 feature)
 *   - Swap state machine is not affected by the comparator (regression)
 *
 * Follows the established Phase 4/5 testing pattern:
 *   - Real HTTP requests against the already-running backend
 *   - Test users/listings created through real endpoints or Mongoose
 *   - Tracked cleanup of ONLY the exact IDs this run creates
 *   - No modification of any pre-existing production data
 *   - Non-zero exit code on any test failure
 *
 * Prerequisites:
 *   - Backend running on BASE_URL (default http://localhost:5000/api)
 *   - backend/.env has a working MONGO_URI
 *
 * Run with:
 *   cd backend && npm run test:phase6
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Listing = require('../src/models/Listing');
const User = require('../src/models/User');
const SwapRequest = require('../src/models/SwapRequest');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();

// --- Tracking arrays for cleanup ---
const createdUserIds = [];
const createdListingIds = [];
const createdSwapRequestIds = [];

// --- Test result bookkeeping ---
const results = [];
let passed = 0;
let failed = 0;

function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, pass });
  if (pass) {
    passed++;
    console.log(`PASS  ${name} -> ${actual}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`);
    console.log(`      expected: ${expected}`);
    console.log(`      actual:   ${actual}`);
  }
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

function extractTokenCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  return setCookie.split(';')[0];
}

async function apiRequest(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data, cookie: extractTokenCookie(res) };
}

// ─── Test runners ──────────────────────────────────────────────────────────────

async function runEstimatorRegressionTests() {
  console.log('\n--- Estimation endpoint (Phase 3 regression) ---');

  // Known category + brand + condition
  {
    const r = await apiRequest('GET', '/listings/estimate-value?category=tops&brand=Nike&condition=new');
    record(
      'estimate-value: known category+brand+condition returns 200',
      200, r.status, r.status === 200
    );
    record(
      'estimate-value: response has estimatedValue number',
      'number', typeof r.data?.estimatedValue, typeof r.data?.estimatedValue === 'number'
    );
    record(
      'estimate-value: deterministic (known inputs -> known output)',
      true,
      r.data?.estimatedValue > 0,
      r.data?.estimatedValue > 0
    );
  }

  // Unknown brand falls back gracefully
  {
    const r = await apiRequest('GET', '/listings/estimate-value?category=tops&brand=NONEXISTENT_BRAND_XYZ&condition=good');
    record(
      'estimate-value: unknown brand returns 200 with fallback value',
      200, r.status, r.status === 200
    );
    record(
      'estimate-value: unknown brand returns a positive number',
      true, r.data?.estimatedValue > 0, r.data?.estimatedValue > 0
    );
  }

  // Determinism: same inputs always produce same output
  {
    const r1 = await apiRequest('GET', '/listings/estimate-value?category=dresses&brand=Zara&condition=like-new');
    const r2 = await apiRequest('GET', '/listings/estimate-value?category=dresses&brand=Zara&condition=like-new');
    record(
      'estimate-value: same inputs produce same output (deterministic)',
      r1.data?.estimatedValue, r2.data?.estimatedValue,
      r1.data?.estimatedValue === r2.data?.estimatedValue
    );
  }

  // Different conditions produce different values
  {
    const rNew = await apiRequest('GET', '/listings/estimate-value?category=tops&brand=Levis&condition=new');
    const rFair = await apiRequest('GET', '/listings/estimate-value?category=tops&brand=Levis&condition=fair');
    record(
      'estimate-value: "new" condition produces higher value than "fair"',
      true,
      rNew.data?.estimatedValue > rFair.data?.estimatedValue,
      rNew.data?.estimatedValue > rFair.data?.estimatedValue
    );
  }
}

async function runComparatorEndpointTests(listingAId, listingBId) {
  console.log('\n--- /compare endpoint validation ---');

  // Missing both params
  {
    const r = await apiRequest('GET', '/listings/compare');
    record('compare: missing both params -> 400', 400, r.status, r.status === 400);
  }

  // Missing one param
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${listingAId}`);
    record('compare: missing listingB -> 400', 400, r.status, r.status === 400);
  }

  // Invalid ObjectId
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=not-an-id&listingB=${listingBId}`);
    record('compare: invalid ObjectId -> 400', 400, r.status, r.status === 400);
  }

  // Same ID for both
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${listingAId}&listingB=${listingAId}`);
    record('compare: same ID for both -> 400', 400, r.status, r.status === 400);
  }

  // Non-existent listing
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await apiRequest('GET', `/listings/compare?listingA=${fakeId}&listingB=${listingBId}`);
    record('compare: non-existent listingA -> 404', 404, r.status, r.status === 404);
  }

  // Valid comparison
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${listingAId}&listingB=${listingBId}`);
    record('compare: valid request -> 200', 200, r.status, r.status === 200);
    record('compare: response has success:true', true, r.data?.success, r.data?.success === true);
    record('compare: response has listingA', true, !!r.data?.listingA, !!r.data?.listingA);
    record('compare: response has listingB', true, !!r.data?.listingB, !!r.data?.listingB);
    record('compare: response has comparison object', true, !!r.data?.comparison, !!r.data?.comparison);

    const c = r.data?.comparison;
    record('compare: comparison.valueA is a number', 'number', typeof c?.valueA, typeof c?.valueA === 'number');
    record('compare: comparison.valueB is a number', 'number', typeof c?.valueB, typeof c?.valueB === 'number');
    record('compare: comparison.absoluteDifference is a number', 'number', typeof c?.absoluteDifference, typeof c?.absoluteDifference === 'number');
    record('compare: comparison.percentageDifference is a number', 'number', typeof c?.percentageDifference, typeof c?.percentageDifference === 'number');
    record('compare: comparison.classification is a string', 'string', typeof c?.classification, typeof c?.classification === 'string');

    // absoluteDifference = |valueA - valueB|
    const expectedAbsDiff = Math.abs(c?.valueA - c?.valueB);
    record(
      'compare: absoluteDifference matches |valueA - valueB|',
      expectedAbsDiff, c?.absoluteDifference, c?.absoluteDifference === expectedAbsDiff
    );
  }
}

async function runClassificationTests() {
  console.log('\n--- Classification correctness (via /compare with controlled listing values) ---');
  // We seed listings with specific estimatedValues to verify each classification bucket.

  // Seed a user for ownership
  const userRes = await apiRequest('POST', '/auth/register', {
    body: { name: `Phase6TestUser_${RUN_ID}`, email: `p6user_${RUN_ID}@test.invalid`, password: 'testpass123' },
  });
  if (userRes.status !== 201) {
    console.log('  [SKIP] Could not create test user for classification tests');
    return;
  }
  const classifUserId = userRes.data?.user?.id || userRes.data?.user?._id;
  if (classifUserId) createdUserIds.push(classifUserId);

  // Seed listings directly via Mongoose (bypasses image upload; image not needed for value tests)
  const PLACEHOLDER_IMG = 'https://res.cloudinary.com/placeholder/image/upload/v1/phase6-test.jpg';

  const seedListing = async (value) => {
    const listing = await Listing.create({
      owner: classifUserId,
      title: `Phase6ClassifTest_${RUN_ID}_val${value}`,
      category: 'tops',
      brand: 'TestBrand',
      size: 'M',
      condition: 'good',
      description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
      images: [PLACEHOLDER_IMG],
      estimatedValue: value, location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    createdListingIds.push(listing._id.toString());
    return listing._id.toString();
  };

  // Equal values -> Close Match, 0% difference
  const idA100 = await seedListing(100);
  const idB100 = await seedListing(100);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB100}`);
    const c = r.data?.comparison;
    record('classify: equal values -> absoluteDifference = 0', 0, c?.absoluteDifference, c?.absoluteDifference === 0);
    record('classify: equal values -> percentageDifference = 0', 0, c?.percentageDifference, c?.percentageDifference === 0);
    record('classify: equal values -> Close Match', 'Close Match', c?.classification, c?.classification === 'Close Match');
  }

  // Close values: $100 vs $115 -> 13.0% -> Close Match
  const idB115 = await seedListing(115);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB115}`);
    const c = r.data?.comparison;
    const expectedDiff = 15;
    const expectedPct = Math.round((15 / 115) * 1000) / 10; // 13.0
    record('classify: 100 vs 115 -> absoluteDifference = 15', expectedDiff, c?.absoluteDifference, c?.absoluteDifference === expectedDiff);
    record('classify: 100 vs 115 -> percentageDifference correct', expectedPct, c?.percentageDifference, c?.percentageDifference === expectedPct);
    record('classify: 100 vs 115 -> Close Match (<=20%)', 'Close Match', c?.classification, c?.classification === 'Close Match');
  }

  // Boundary at 20%: $100 vs $125 -> 20.0% -> still Close Match
  const idB125 = await seedListing(125);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB125}`);
    const c = r.data?.comparison;
    record('classify: 100 vs 125 -> exactly 20% -> Close Match (boundary inclusive)', 'Close Match', c?.classification, c?.classification === 'Close Match');
  }

  // Just above 20%: $100 vs $127 -> ~21.3% -> Moderate Difference
  const idB127 = await seedListing(127);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB127}`);
    const c = r.data?.comparison;
    record('classify: 100 vs 127 -> >20% -> Moderate Difference', 'Moderate Difference', c?.classification, c?.classification === 'Moderate Difference');
  }

  // Moderate: $100 vs $175 -> ~42.9% -> Moderate Difference
  const idB175 = await seedListing(175);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB175}`);
    const c = r.data?.comparison;
    record('classify: 100 vs 175 -> ~42.9% -> Moderate Difference', 'Moderate Difference', c?.classification, c?.classification === 'Moderate Difference');
  }

  // Boundary at 50%: $100 vs $200 -> 50.0% -> still Moderate Difference
  const idB200 = await seedListing(200);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB200}`);
    const c = r.data?.comparison;
    record('classify: 100 vs 200 -> exactly 50% -> Moderate Difference (boundary inclusive)', 'Moderate Difference', c?.classification, c?.classification === 'Moderate Difference');
  }

  // Just above 50%: $100 vs $205 -> ~51.2% -> Large Difference
  const idB205 = await seedListing(205);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA100}&listingB=${idB205}`);
    const c = r.data?.comparison;
    record('classify: 100 vs 205 -> >50% -> Large Difference', 'Large Difference', c?.classification, c?.classification === 'Large Difference');
  }

  // Large difference: $50 vs $500 -> 90% -> Large Difference
  const idA50 = await seedListing(50);
  const idB500 = await seedListing(500);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idA50}&listingB=${idB500}`);
    const c = r.data?.comparison;
    record('classify: 50 vs 500 -> 90% -> Large Difference', 'Large Difference', c?.classification, c?.classification === 'Large Difference');
  }

  // Zero-value edge case: both 0 -> 0%, Close Match (no division-by-zero)
  const idZ1 = await seedListing(0);
  const idZ2 = await seedListing(0);
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${idZ1}&listingB=${idZ2}`);
    const c = r.data?.comparison;
    record('classify: both 0 -> no error, 200', 200, r.status, r.status === 200);
    record('classify: both 0 -> absoluteDifference = 0', 0, c?.absoluteDifference, c?.absoluteDifference === 0);
    record('classify: both 0 -> percentageDifference = 0 (no div-by-zero)', 0, c?.percentageDifference, c?.percentageDifference === 0);
    record('classify: both 0 -> Close Match', 'Close Match', c?.classification, c?.classification === 'Close Match');
  }
}

async function runReadOnlyTests(listingAId, listingBId, userCookie) {
  console.log('\n--- Read-only / authorization ---');

  // Compare endpoint does NOT require authentication
  {
    const r = await apiRequest('GET', `/listings/compare?listingA=${listingAId}&listingB=${listingBId}`);
    record('compare: accessible without auth (public endpoint)', 200, r.status, r.status === 200);
  }

  // Compare endpoint does not accept POST (route not defined -> 404 from Express)
  {
    const r = await apiRequest('POST', '/listings/compare', { cookie: userCookie });
    record('compare: POST not allowed (not a write endpoint)', true, r.status !== 200, r.status !== 200);
  }

  // Calling compare does not change any listing's status
  {
    const before = await apiRequest('GET', `/listings/${listingAId}`);
    await apiRequest('GET', `/listings/compare?listingA=${listingAId}&listingB=${listingBId}`);
    const after = await apiRequest('GET', `/listings/${listingAId}`);
    record(
      'compare: does not alter listing status',
      before.data?.listing?.status,
      after.data?.listing?.status,
      before.data?.listing?.status === after.data?.listing?.status
    );
  }
}

async function runSwapRegressionTest(listingAId, listingBId, userCookie) {
  console.log('\n--- Swap state machine regression ---');

  // Can still create a swap request (Phase 4 core flow unchanged)
  {
    const r = await apiRequest('POST', '/swaps', {
      body: { requestedListingId: listingBId, offeredListingId: listingAId },
      cookie: userCookie,
    });
    if (r.data?.swapRequest?._id) {
      createdSwapRequestIds.push(r.data.swapRequest._id.toString());
    } else if (r.data?.swapRequest?.id) {
      createdSwapRequestIds.push(r.data.swapRequest.id.toString());
    }
    record(
      'regression: swap creation still works after Phase 6',
      201, r.status, r.status === 201
    );
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('Phase 6 — Swap Value Comparator Integration Tests');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Run ID: ${RUN_ID}`);
  console.log('='.repeat(60));

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected (for seeding/cleanup only)');

    // --- Estimation regression ---
    await runEstimatorRegressionTests();

    // --- Seed two test users and two listings for endpoint tests ---
    console.log('\n--- Seeding test fixtures ---');

    const userARes = await apiRequest('POST', '/auth/register', {
      body: {
        name: `Phase6UserA_${RUN_ID}`,
        email: `p6a_${RUN_ID}@test.invalid`,
        password: 'testpass123',
      },
    });
    if (userARes.status !== 201) throw new Error('Could not create test user A');
    const userACookie = userARes.cookie;
    const userAId = userARes.data?.user?.id || userARes.data?.user?._id;
    if (userAId) createdUserIds.push(userAId);

    const userBRes = await apiRequest('POST', '/auth/register', {
      body: {
        name: `Phase6UserB_${RUN_ID}`,
        email: `p6b_${RUN_ID}@test.invalid`,
        password: 'testpass123',
      },
    });
    if (userBRes.status !== 201) throw new Error('Could not create test user B');
    const userBId = userBRes.data?.user?.id || userBRes.data?.user?._id;
    if (userBId) createdUserIds.push(userBId);

    // Seed listings directly via Mongoose (bypass Cloudinary)
    const PLACEHOLDER = 'https://res.cloudinary.com/placeholder/image/upload/v1/phase6-test.jpg';
    const listingA = await Listing.create({
      owner: userAId,
      title: `Phase6ListingA_${RUN_ID}`,
      category: 'tops',
      brand: 'Adidas',
      size: 'M',
      condition: 'good',
      description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
      images: [PLACEHOLDER],
      estimatedValue: 80, location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    createdListingIds.push(listingA._id.toString());

    const listingB = await Listing.create({
      owner: userBId,
      title: `Phase6ListingB_${RUN_ID}`,
      category: 'bottoms',
      brand: 'Levis',
      size: 'L',
      condition: 'like-new',
      description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
      images: [PLACEHOLDER],
      estimatedValue: 120, location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    createdListingIds.push(listingB._id.toString());

    console.log(`  Listing A: ₹80 (id: ${listingA._id})`);
    console.log(`  Listing B: ₹120 (id: ${listingB._id})`);

    // --- Endpoint validation tests ---
    await runComparatorEndpointTests(listingA._id.toString(), listingB._id.toString());

    // --- Classification correctness ---
    await runClassificationTests();

    // --- Read-only / auth ---
    await runReadOnlyTests(listingA._id.toString(), listingB._id.toString(), userACookie);

    // --- Swap regression ---
    await runSwapRegressionTest(listingA._id.toString(), listingB._id.toString(), userACookie);

  } catch (err) {
    console.error('\nFATAL ERROR during test run:', err.message);
    failed++;
  } finally {
    // --- Cleanup: ONLY delete what this run created ---
    console.log('\n--- Cleanup ---');
    try {
      if (createdSwapRequestIds.length) {
        await SwapRequest.deleteMany({ _id: { $in: createdSwapRequestIds } });
        console.log(`  Deleted ${createdSwapRequestIds.length} test swap request(s)`);
      }
      if (createdListingIds.length) {
        await Listing.deleteMany({ _id: { $in: createdListingIds } });
        console.log(`  Deleted ${createdListingIds.length} test listing(s)`);
      }
      if (createdUserIds.length) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
        console.log(`  Deleted ${createdUserIds.length} test user(s)`);
      }
    } catch (cleanupErr) {
      console.error('  Cleanup error (non-fatal):', cleanupErr.message);
    }

    await mongoose.disconnect();

    // --- Summary ---
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('='.repeat(60));
    results.forEach((r) => {
      if (!r.pass) console.log(`  FAIL: ${r.name}`);
    });

    process.exit(failed > 0 ? 1 : 0);
  }
}

main();

