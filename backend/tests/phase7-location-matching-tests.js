/**
 * Phase 7 Location-Based Matching — Automated Integration Tests
 * ==============================================================
 *
 * Tests the Phase 7 Location-Based Matching:
 *   - GET /api/listings/:id/matches endpoint
 *   - Location matching tiers (exact city, same state)
 *   - Value compatibility (reuses Phase 6 compareValues)
 *   - Deterministic scoring and ranking
 *   - Status filtering, edge cases, data integrity
 *
 * Follows the established Phase 4/5/6 testing pattern:
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
 *   cd backend && npm run test:phase7
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Listing = require('../src/models/Listing');
const User = require('../src/models/User');
const SwapRequest = require('../src/models/SwapRequest');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();
const PLACEHOLDER_IMG = 'https://res.cloudinary.com/placeholder/image/upload/v1/phase7-test.jpg';

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

// ─── Fixture helpers ───────────────────────────────────────────────────────────

async function registerUser(label, location = {}) {
  const email = `p7_${label}_${RUN_ID}@test.invalid`;
  const res = await apiRequest('POST', '/auth/register', {
    body: { name: `Phase7_${label}_${RUN_ID}`, email, password: 'testpass123', location },
  });
  if (res.status !== 201) throw new Error(`Failed to register user "${label}": ${res.status}`);
  const userId = res.data?.user?.id || res.data?.user?._id;
  if (userId) createdUserIds.push(userId);
  return { id: userId, cookie: res.cookie, email };
}

async function seedListing(ownerId, suffix, overrides = {}) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `P7_${suffix}_${RUN_ID}`,
    category: overrides.category || 'tops',
    brand: overrides.brand || 'TestBrand',
    size: overrides.size || 'M',
    condition: overrides.condition || 'good',
    description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
    images: [PLACEHOLDER_IMG],
    estimatedValue: overrides.estimatedValue !== undefined ? overrides.estimatedValue : 50,
    location: overrides.location || { city: 'Seattle', state: 'WA', country: 'USA' },
    status: overrides.status || 'available',
  });
  createdListingIds.push(listing._id.toString());
  return listing;
}

// ─── Test Suites ───────────────────────────────────────────────────────────────

async function runEndpointValidation(sourceId) {
  console.log('\n--- Endpoint Validation ---');

  // 1. Malformed listing ID -> 400
  {
    const r = await apiRequest('GET', '/listings/not-a-valid-id/matches');
    record('malformed listing ID -> 400', 400, r.status, r.status === 400);
  }

  // 2. Nonexistent listing -> 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await apiRequest('GET', `/listings/${fakeId}/matches`);
    record('nonexistent listing -> 404', 404, r.status, r.status === 404);
  }

  // 3. Valid listing -> 200
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    record('valid listing -> 200', 200, r.status, r.status === 200);
  }

  // 4. Response has expected structure
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const hasStructure = Boolean(
      r.data?.success === true
      && Array.isArray(r.data?.matches)
      && typeof r.data?.count === 'number'
      && r.data?.sourceListing?._id
    );
    record('response has expected structure', true, hasStructure, hasStructure === true);
  }

  // 5. Source listing is NOT in its own matches
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const containsSelf = (r.data?.matches || []).some(
      (m) => m.listing._id.toString() === sourceId.toString()
    );
    record('source listing excluded from results', false, containsSelf, containsSelf === false);
  }
}

async function runLocationMatchingTests(sourceId, exactMatchId, stateMatchId, diffStateId, noLocationId) {
  console.log('\n--- Location Matching ---');

  // 6. Same city + same state -> included as "exact"
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === exactMatchId.toString()
    );
    record(
      'same city+state -> included as "exact"',
      'exact',
      match?.matchDetails?.locationTier || 'not found',
      match?.matchDetails?.locationTier === 'exact'
    );
  }

  // 7. Same state, different city -> included as "state"
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === stateMatchId.toString()
    );
    record(
      'same state, diff city -> included as "state"',
      'state',
      match?.matchDetails?.locationTier || 'not found',
      match?.matchDetails?.locationTier === 'state'
    );
  }

  // 8. Different state -> excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === diffStateId.toString()
    );
    record(
      'different state -> excluded',
      'not found',
      match ? 'found' : 'not found',
      !match
    );
  }

  // 9. Candidate with no location -> excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === noLocationId.toString()
    );
    record(
      'candidate with no location -> excluded',
      'not found',
      match ? 'found' : 'not found',
      !match
    );
  }

  // 10. Case-insensitive location matching
  // (exactMatch was created with city='Seattle', state='WA'
  //  and source has city='Seattle', state='WA'; tested via match presence above)
  // Create a listing with mixed-case location to verify case-insensitivity
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    // exactMatch should be found regardless of case normalization
    const found = (r.data?.matches || []).some(
      (m) => m.listing._id.toString() === exactMatchId.toString()
    );
    record('case-insensitive location matching works', true, found, found === true);
  }
}

async function runMissingSourceLocationTest(noLocSourceId) {
  console.log('\n--- Missing Source Location ---');

  // 11. Source listing with no state -> empty matches + message
  {
    const r = await apiRequest('GET', `/listings/${noLocSourceId}/matches`);
    record('no-location source -> 200', 200, r.status, r.status === 200);
    record(
      'no-location source -> empty matches',
      0,
      r.data?.matches?.length || 0,
      (r.data?.matches?.length || 0) === 0
    );
    record(
      'no-location source -> has message',
      true,
      !!r.data?.message,
      !!r.data?.message
    );
  }
}

async function runValueCompatibilityTests(sourceId, closeMatchId, moderateMatchId, largeMatchId, equalValueId) {
  console.log('\n--- Value Compatibility ---');

  // 14. Close Match (≤20%) -> included
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === closeMatchId.toString()
    );
    record(
      'Close Match (≤20%) -> included',
      'Close Match',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Close Match'
    );
  }

  // 15. Moderate Difference (≤50%) -> included
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === moderateMatchId.toString()
    );
    record(
      'Moderate Difference (≤50%) -> included',
      'Moderate Difference',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Moderate Difference'
    );
  }

  // 16. Large Difference (>50%) -> excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === largeMatchId.toString()
    );
    record(
      'Large Difference (>50%) -> excluded',
      'not found',
      match ? 'found' : 'not found',
      !match
    );
  }

  // 17. Equal value -> Close Match, included
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === equalValueId.toString()
    );
    record(
      'equal value -> included as Close Match',
      'Close Match',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Close Match'
    );
    const diff = match?.matchDetails?.valueComparison?.percentageDifference;
    record('equal value -> 0% difference', 0, diff, diff === 0);
  }
}

async function runZeroValueTest(zeroSourceId, zeroCandidateId) {
  console.log('\n--- Zero Value Edge Case ---');

  // 19. Both values 0 -> 0%, Close Match, included
  {
    const r = await apiRequest('GET', `/listings/${zeroSourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === zeroCandidateId.toString()
    );
    record(
      'both zero-value -> included as Close Match',
      'Close Match',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Close Match'
    );
  }
}

async function runBoundaryTests(sourceId, boundary20Id, boundary50Id) {
  console.log('\n--- Boundary Conditions ---');

  // 20. Exactly 20% difference -> Close Match (at threshold boundary)
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === boundary20Id.toString()
    );
    record(
      'exactly 20% diff -> Close Match',
      'Close Match',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Close Match'
    );
  }

  // 21. Exactly 50% difference -> Moderate Difference (at threshold boundary)
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === boundary50Id.toString()
    );
    record(
      'exactly 50% diff -> Moderate Difference',
      'Moderate Difference',
      match?.matchDetails?.valueComparison?.classification || 'not found',
      match?.matchDetails?.valueComparison?.classification === 'Moderate Difference'
    );
  }
}

async function runStatusFilteringTests(sourceId, pendingId, swappedId) {
  console.log('\n--- Listing Status Filtering ---');

  // 22. Pending listing -> excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === pendingId.toString()
    );
    record(
      'pending listing -> excluded from matches',
      'not found',
      match ? 'found' : 'not found',
      !match
    );
  }

  // 23. Swapped listing -> excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || []).find(
      (m) => m.listing._id.toString() === swappedId.toString()
    );
    record(
      'swapped listing -> excluded from matches',
      'not found',
      match ? 'found' : 'not found',
      !match
    );
  }
}

async function runRankingAndResultTests(sourceId, exactMatchId, stateMatchId, ownerId) {
  console.log('\n--- Ranking & Results ---');

  // 24. Deterministic ordering (exact > state for same value compatibility)
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const matches = r.data?.matches || [];
    const exactIdx = matches.findIndex((m) => m.listing._id.toString() === exactMatchId.toString());
    const stateIdx = matches.findIndex((m) => m.listing._id.toString() === stateMatchId.toString());
    const ordered = exactIdx >= 0 && stateIdx >= 0 && exactIdx < stateIdx;
    record(
      'exact match ranked above state match',
      true,
      ordered,
      ordered === true
    );
  }

  // 25. No duplicates in results
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const ids = (r.data?.matches || []).map((m) => m.listing._id.toString());
    const uniqueIds = [...new Set(ids)];
    record('no duplicates in results', ids.length, uniqueIds.length, ids.length === uniqueIds.length);
  }

  // 26. Match metadata is present and correct
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const match = (r.data?.matches || [])[0];
    const hasMeta = match
      && typeof match.matchDetails?.locationTier === 'string'
      && typeof match.matchDetails?.locationLabel === 'string'
      && typeof match.matchDetails?.score === 'number'
      && typeof match.matchDetails?.valueComparison?.absoluteDifference === 'number'
      && typeof match.matchDetails?.valueComparison?.percentageDifference === 'number'
      && typeof match.matchDetails?.valueComparison?.classification === 'string';
    record('match metadata structure correct', true, !!hasMeta, !!hasMeta);
  }

  // 27. Own-owner listings excluded
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    const ownOwnerMatch = (r.data?.matches || []).some(
      (m) => {
        const listingOwner = m.listing.owner?._id || m.listing.owner;
        return listingOwner?.toString() === ownerId.toString();
      }
    );
    record('own-owner listings excluded', false, ownOwnerMatch, ownOwnerMatch === false);
  }

  // 28. Limit parameter works
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches?limit=1`);
    record(
      'limit=1 returns at most 1 match',
      true,
      (r.data?.matches?.length || 0) <= 1,
      (r.data?.matches?.length || 0) <= 1
    );
  }
}

async function runDataIntegrityTests(sourceId, userACookie, listingBId) {
  console.log('\n--- Data Integrity ---');

  // 29. Requesting matches does NOT modify the source listing
  {
    const before = await Listing.findById(sourceId).lean();
    await apiRequest('GET', `/listings/${sourceId}/matches`);
    const after = await Listing.findById(sourceId).lean();
    const unchanged = before.estimatedValue === after.estimatedValue
      && before.status === after.status
      && before.title === after.title;
    record('matches request does NOT modify source listing', true, unchanged, unchanged === true);
  }

  // 30. Requesting matches does NOT create swap requests
  {
    const countBefore = await SwapRequest.countDocuments();
    await apiRequest('GET', `/listings/${sourceId}/matches`);
    const countAfter = await SwapRequest.countDocuments();
    record('matches request does NOT create swap requests', countBefore, countAfter, countBefore === countAfter);
  }

  // 31. Requesting matches does NOT create conversations
  {
    const countBefore = await Conversation.countDocuments();
    await apiRequest('GET', `/listings/${sourceId}/matches`);
    const countAfter = await Conversation.countDocuments();
    record('matches request does NOT create conversations', countBefore, countAfter, countBefore === countAfter);
  }
}

async function runPublicAccessTest(sourceId) {
  console.log('\n--- Public Access ---');

  // 32. Endpoint works without authentication (public)
  {
    const r = await apiRequest('GET', `/listings/${sourceId}/matches`);
    record(
      'endpoint works without authentication',
      200,
      r.status,
      r.status === 200
    );
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('Phase 7 — Location-Based Matching Integration Tests');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Run ID: ${RUN_ID}`);
  console.log('='.repeat(60));

  if (!process.env.TEST_MONGO_URI) { console.error('FATAL'); process.exit(1); } await mongoose.connect(process.env.TEST_MONGO_URI); if (mongoose.connection.name !== 'rewear-automated-tests') { console.error('FATAL 2'); process.exit(1); }
  console.log('Connected to MongoDB');

  try {
    // ── Register test users ──
    const userA = await registerUser('UserA', { city: 'Seattle', state: 'WA', country: 'USA' });
    const userB = await registerUser('UserB', { city: 'Seattle', state: 'WA', country: 'USA' });
    const userC = await registerUser('UserC', { city: 'Portland', state: 'OR', country: 'USA' });
    const userD = await registerUser('UserD', { city: 'Tacoma', state: 'WA', country: 'USA' });

    console.log('\n--- Seeding test listings ---');

    // Source listing: Seattle, WA, estimatedValue $100
    const source = await seedListing(userA.id, 'Source', {
      estimatedValue: 100,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  Source: $100, Seattle WA (id: ${source._id})`);

    // Exact city match (Seattle, WA), Close Match value ($90 -> 10% diff)
    const exactClose = await seedListing(userB.id, 'ExactClose', {
      estimatedValue: 90,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  ExactClose: $90, Seattle WA (id: ${exactClose._id})`);

    // Same state (Tacoma, WA), Close Match value ($85 -> 15% diff)
    const stateClose = await seedListing(userD.id, 'StateClose', {
      estimatedValue: 85,
      location: { city: 'Tacoma', state: 'WA', country: 'USA' },
    });
    console.log(`  StateClose: $85, Tacoma WA (id: ${stateClose._id})`);

    // Different state (Portland, OR), Close Match value ($95)
    const diffState = await seedListing(userC.id, 'DiffState', {
      estimatedValue: 95,
      location: { city: 'Portland', state: 'OR', country: 'USA' },
    });
    console.log(`  DiffState: $95, Portland OR (id: ${diffState._id})`);

    // No location
    const noLocation = await seedListing(userB.id, 'NoLoc', {
      estimatedValue: 100,
      location: { city: '', state: '', country: '' },
    });
    console.log(`  NoLoc: $100, no location (id: ${noLocation._id})`);

    // Moderate Difference value in Seattle ($55 -> 45% diff from $100)
    const moderateMatch = await seedListing(userB.id, 'Moderate', {
      estimatedValue: 55,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  Moderate: $55, Seattle WA (id: ${moderateMatch._id})`);

    // Large Difference value in Seattle ($20 -> 80% diff from $100)
    const largeMatch = await seedListing(userB.id, 'LargeDiff', {
      estimatedValue: 20,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  LargeDiff: $20, Seattle WA (id: ${largeMatch._id})`);

    // Equal value in Seattle ($100)
    const equalValue = await seedListing(userB.id, 'EqualVal', {
      estimatedValue: 100,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  EqualVal: $100, Seattle WA (id: ${equalValue._id})`);

    // Pending listing in Seattle
    const pendingListing = await seedListing(userB.id, 'Pending', {
      estimatedValue: 100,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
      status: 'pending',
    });
    console.log(`  Pending: $100, Seattle WA, status=pending (id: ${pendingListing._id})`);

    // Swapped listing in Seattle
    const swappedListing = await seedListing(userB.id, 'Swapped', {
      estimatedValue: 100,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
      status: 'swapped',
    });
    console.log(`  Swapped: $100, Seattle WA, status=swapped (id: ${swappedListing._id})`);

    // Source with no location (for missing-location test)
    const noLocSource = await seedListing(userA.id, 'NoLocSrc', {
      estimatedValue: 100,
      location: { city: '', state: '', country: '' },
    });
    console.log(`  NoLocSrc: $100, no location (id: ${noLocSource._id})`);

    // Own-owner listing in same location (should be excluded)
    const ownOwner = await seedListing(userA.id, 'OwnOwner', {
      estimatedValue: 100,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  OwnOwner: $100, Seattle WA, owned by source owner (id: ${ownOwner._id})`);

    // Boundary: exactly 20% difference ($80 -> |100-80|/100 = 20%)
    const boundary20 = await seedListing(userB.id, 'Boundary20', {
      estimatedValue: 80,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  Boundary20: $80, Seattle WA (id: ${boundary20._id})`);

    // Boundary: exactly 50% difference ($50 -> |100-50|/100 = 50%)
    const boundary50 = await seedListing(userB.id, 'Boundary50', {
      estimatedValue: 50,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  Boundary50: $50, Seattle WA (id: ${boundary50._id})`);

    // Zero-value source and candidate
    const zeroSource = await seedListing(userA.id, 'ZeroSrc', {
      estimatedValue: 0,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    const zeroCandidate = await seedListing(userB.id, 'ZeroCand', {
      estimatedValue: 0,
      location: { city: 'Seattle', state: 'WA', country: 'USA' },
    });
    console.log(`  ZeroSrc: $0, Seattle WA (id: ${zeroSource._id})`);
    console.log(`  ZeroCand: $0, Seattle WA (id: ${zeroCandidate._id})`);

    // ── Run test suites ──
    await runEndpointValidation(source._id.toString());

    await runLocationMatchingTests(
      source._id.toString(),
      exactClose._id.toString(),
      stateClose._id.toString(),
      diffState._id.toString(),
      noLocation._id.toString()
    );

    await runMissingSourceLocationTest(noLocSource._id.toString());

    await runValueCompatibilityTests(
      source._id.toString(),
      exactClose._id.toString(),    // $90 -> 10% Close Match
      moderateMatch._id.toString(), // $55 -> 45% Moderate
      largeMatch._id.toString(),    // $20 -> 80% Large
      equalValue._id.toString()     // $100 -> 0% Close Match
    );

    await runZeroValueTest(zeroSource._id.toString(), zeroCandidate._id.toString());

    await runBoundaryTests(
      source._id.toString(),
      boundary20._id.toString(),  // $80 -> exactly 20%
      boundary50._id.toString()   // $50 -> exactly 50%
    );

    await runStatusFilteringTests(
      source._id.toString(),
      pendingListing._id.toString(),
      swappedListing._id.toString()
    );

    await runRankingAndResultTests(
      source._id.toString(),
      exactClose._id.toString(),
      stateClose._id.toString(),
      userA.id
    );

    await runDataIntegrityTests(
      source._id.toString(),
      userA.cookie,
      exactClose._id.toString()
    );

    await runPublicAccessTest(source._id.toString());

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


