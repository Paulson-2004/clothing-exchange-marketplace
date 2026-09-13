/**
 * Phase 4 Swap Request API - Automated Integration Tests
 * =========================================================
 *
 * This script is intentionally SEPARATE from the application source
 * code. It does not modify, import, or depend on anything under
 * backend/src except the Mongoose models (used only for seeding test
 * fixtures and independently verifying database state - never for
 * generating the pass/fail verdicts themselves).
 *
 * What this script actually tests:
 *   - Real HTTP requests are sent to your already-running backend at
 *     BASE_URL (default http://localhost:5000/api). This script does
 *     NOT start the server itself - run `npm run dev` in another
 *     terminal first.
 *   - Test users are created through the real POST /api/auth/register
 *     endpoint, and the httpOnly JWT cookie issued by that endpoint is
 *     captured and replayed on subsequent requests, exactly like a
 *     real browser session would.
 *   - Test listings are seeded directly via Mongoose (bypassing the
 *     Cloudinary image upload flow) using a placeholder image URL,
 *     since the swap endpoints - not listing image upload - are what
 *     is under test here.
 *
 * Cleanup:
 *   Every User, Listing, and SwapRequest ID this script creates is
 *   tracked as it goes. In the `finally` block at the end, ONLY those
 *   exact IDs are deleted. Nothing else in your database is ever
 *   touched, queried-and-deleted-by-pattern, or modified.
 *
 * Requirements:
 *   - Node 18+ (uses the built-in global `fetch`)
 *   - Backend running locally on BASE_URL
 *   - backend/.env must have a working MONGO_URI (same one your
 *     server already uses)
 *
 * Run with:
 *   cd backend
 *   node tests/phase4-swap-tests.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SwapRequest = require('../src/models/SwapRequest');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now(); // keeps every run's emails/titles unique

// --- Tracking arrays for cleanup - ONLY these exact IDs get deleted ---
const createdUserIds = [];
const createdListingIds = [];
const createdSwapRequestIds = [];

// --- Test result bookkeeping ---
const results = []; // { name, expected, actual, pass }

function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, pass });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`${tag}  ${name} -> ${actual}`);
}

// ---------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------

// Extracts just the "token=..." part of the Set-Cookie header. The app
// only ever sets one cookie (see authController.js), so a plain
// header.get() is safe here - no multi-cookie parsing needed.
function extractTokenCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  return setCookie.split(';')[0]; // "token=<jwt>"
}

async function apiRequest(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Some responses (rare) may not have a JSON body - that's fine.
  }

  return { status: response.status, data, rawResponse: response };
}

// Registers a real user through the real API and returns their cookie
// + user id, exactly as a real login session would look.
async function registerTestUser(label) {
  const email = `phase4test.${label}.${RUN_ID}@test.local`;
  const { status, data, rawResponse } = await apiRequest('POST', '/auth/register', {
    body: { name: `Phase4 Test ${label}`, email, password: 'TestPass123!' },
  });

  if (status !== 201 || !data?.user?.id) {
    throw new Error(`Failed to register test user "${label}": status=${status} body=${JSON.stringify(data)}`);
  }

  const cookie = extractTokenCookie(rawResponse);
  if (!cookie) {
    throw new Error(`Registered test user "${label}" but no auth cookie was returned`);
  }

  createdUserIds.push(data.user.id);
  return { id: data.user.id, email, cookie };
}

// Seeds a listing directly via Mongoose - bypasses Cloudinary entirely.
// A placeholder URL is used only to satisfy the schema's "at least one
// image" validation; no real upload occurs.
async function seedListing(ownerId, titleSuffix, overrides = {}) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `PHASE4-TEST ${titleSuffix} ${RUN_ID}`,
    category: 'tops',
    brand: 'TestBrand',
    size: 'M',
    condition: 'good',
    description: 'Automated Phase 4 test fixture listing.',
    images: ['https://example.com/placeholder-test-image.jpg'],
    estimatedValue: 20,
    location: { city: 'Test City', state: 'TS', country: 'Testland' },
    status: 'available',
    ...overrides,
  });

  createdListingIds.push(listing._id.toString());
  return listing;
}

// ---------------------------------------------------------------------
// Main test sequence
// ---------------------------------------------------------------------

async function main() {
  console.log(`\nConnecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  console.log(`Using backend at ${BASE_URL}`);
  console.log(`Run ID: ${RUN_ID}\n`);

  console.log('Setting up test users...');
  const userA = await registerTestUser('usera');
  const userB = await registerTestUser('userb');
  const userC = await registerTestUser('userc');
  console.log(`  User A: ${userA.email}`);
  console.log(`  User B: ${userB.email}`);
  console.log(`  User C: ${userC.email}\n`);

  console.log('Seeding test listings...\n');

  // ===================================================================
  // TEST 11: Valid request creation (also the foundation for 12 & 13)
  // ===================================================================
  const listing_A1 = await seedListing(userA.id, 'A-offer-for-valid-flow');
  const listing_B1 = await seedListing(userB.id, 'B-requested-for-valid-flow');

  let validSwapId = null;
  {
    const { status, data } = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B1._id.toString(), offeredListingId: listing_A1._id.toString() },
    });
    const pass = status === 201 && data?.swapRequest?.status === 'pending';
    if (data?.swapRequest?._id) {
      validSwapId = data.swapRequest._id;
      createdSwapRequestIds.push(validSwapId);
    }
    record('Valid request creation', '201, status pending', `${status}${data?.swapRequest ? `, status=${data.swapRequest.status}` : ''}`, pass);
  }

  // ===================================================================
  // TEST 1 (of the "offer someone else's listing" case): 403
  // ===================================================================
  const listing_C1 = await seedListing(userC.id, 'C-target-for-various-tests');
  const listing_A2 = await seedListing(userA.id, 'A-spare-2');
  {
    // A tries to offer B's listing (listing_B1) while requesting C's listing.
    const { status, data } = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_C1._id.toString(), offeredListingId: listing_B1._id.toString() },
    });
    const pass = status === 403;
    record('Offer someone else\'s listing', '403', status, pass);
  }

  // ===================================================================
  // TEST: Duplicate pending request -> 409
  // ===================================================================
  {
    // Create an initial pending request: A requests C's listing offering A2.
    const first = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_C1._id.toString(), offeredListingId: listing_A2._id.toString() },
    });
    if (first.data?.swapRequest?._id) createdSwapRequestIds.push(first.data.swapRequest._id);

    // Attempt the exact same pair again while the first is still pending.
    const dup = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_C1._id.toString(), offeredListingId: listing_A2._id.toString() },
    });
    const pass = first.status === 201 && dup.status === 409;
    record('Duplicate pending request', '409 on second attempt', `first=${first.status}, duplicate=${dup.status}`, pass);
  }

  // ===================================================================
  // TEST: Request unavailable listing -> 400
  // ===================================================================
  const listing_B2 = await seedListing(userB.id, 'B-unavailable', { status: 'pending' });
  const listing_A3 = await seedListing(userA.id, 'A-spare-3');
  {
    const { status, data } = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B2._id.toString(), offeredListingId: listing_A3._id.toString() },
    });
    const pass = status === 400;
    record('Request unavailable listing', '400', status, pass);
  }

  // ===================================================================
  // TEST: Conflict auto-rejection
  // ===================================================================
  const listing_A4 = await seedListing(userA.id, 'A-conflict-target');
  const listing_B4 = await seedListing(userB.id, 'B-conflict-requested');
  const listing_C2 = await seedListing(userC.id, 'C-conflict-offer');

  let conflictMainId = null;
  let conflictOtherId = null;
  {
    // Main request: A requests B4, offering A4.
    const main = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B4._id.toString(), offeredListingId: listing_A4._id.toString() },
    });
    conflictMainId = main.data?.swapRequest?._id;
    if (conflictMainId) createdSwapRequestIds.push(conflictMainId);

    // Conflicting request: C requests A4 (the same listing A is offering
    // in the main request), offering C2.
    const other = await apiRequest('POST', '/swaps', {
      cookie: userC.cookie,
      body: { requestedListingId: listing_A4._id.toString(), offeredListingId: listing_C2._id.toString() },
    });
    conflictOtherId = other.data?.swapRequest?._id;
    if (conflictOtherId) createdSwapRequestIds.push(conflictOtherId);

    // B (owner of B4) accepts the main request.
    const accept = await apiRequest('PATCH', `/swaps/${conflictMainId}/accept`, { cookie: userB.cookie });

    // Verify the conflicting request was auto-rejected - check the DB
    // directly rather than trusting only the accept response.
    const conflictDoc = await SwapRequest.findById(conflictOtherId);

    const pass =
      main.status === 201 &&
      other.status === 201 &&
      accept.status === 200 &&
      accept.data?.swapRequest?.status === 'accepted' &&
      conflictDoc?.status === 'rejected';

    record(
      'Conflict auto-rejection',
      'accept=200/accepted, conflicting request auto-rejected',
      `accept=${accept.status}/${accept.data?.swapRequest?.status}, conflictingRequestStatus=${conflictDoc?.status}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Reject request
  // ===================================================================
  const listing_A5 = await seedListing(userA.id, 'A-for-reject-test');
  const listing_B5 = await seedListing(userB.id, 'B-for-reject-test');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B5._id.toString(), offeredListingId: listing_A5._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    const reject = await apiRequest('PATCH', `/swaps/${swapId}/reject`, { cookie: userB.cookie });

    // Verify listings were NOT changed to pending/swapped.
    const listingA5After = await Listing.findById(listing_A5._id);
    const listingB5After = await Listing.findById(listing_B5._id);

    const pass =
      reject.status === 200 &&
      reject.data?.swapRequest?.status === 'rejected' &&
      listingA5After.status === 'available' &&
      listingB5After.status === 'available';

    record(
      'Reject request',
      '200, status rejected, listings remain available',
      `${reject.status}, status=${reject.data?.swapRequest?.status}, listingA=${listingA5After.status}, listingB=${listingB5After.status}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Cancel request
  // ===================================================================
  const listing_A6 = await seedListing(userA.id, 'A-for-cancel-test');
  const listing_B6 = await seedListing(userB.id, 'B-for-cancel-test');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B6._id.toString(), offeredListingId: listing_A6._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    const cancel = await apiRequest('PATCH', `/swaps/${swapId}/cancel`, { cookie: userA.cookie });

    const listingA6After = await Listing.findById(listing_A6._id);
    const listingB6After = await Listing.findById(listing_B6._id);

    const pass =
      cancel.status === 200 &&
      cancel.data?.swapRequest?.status === 'cancelled' &&
      listingA6After.status === 'available' &&
      listingB6After.status === 'available';

    record(
      'Cancel request',
      '200, status cancelled, listings remain available',
      `${cancel.status}, status=${cancel.data?.swapRequest?.status}, listingA=${listingA6After.status}, listingB=${listingB6After.status}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Complete a PENDING request -> 400
  // ===================================================================
  const listing_A7 = await seedListing(userA.id, 'A-for-complete-pending-test');
  const listing_B7 = await seedListing(userB.id, 'B-for-complete-pending-test');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B7._id.toString(), offeredListingId: listing_A7._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    const complete = await apiRequest('PATCH', `/swaps/${swapId}/complete`, { cookie: userB.cookie });

    const swapDocAfter = await SwapRequest.findById(swapId);

    const pass = complete.status === 400 && swapDocAfter?.status === 'pending';
    record('Complete a pending request', '400, remains pending', `${complete.status}, status=${swapDocAfter?.status}`, pass);
  }

  // ===================================================================
  // TEST: Complete a REJECTED request -> 400, and a CANCELLED request -> 400
  // (reported as one combined test case, matching the original checklist)
  // ===================================================================
  const listing_A8 = await seedListing(userA.id, 'A-for-complete-rejected-test');
  const listing_B8 = await seedListing(userB.id, 'B-for-complete-rejected-test');
  const listing_A9 = await seedListing(userA.id, 'A-for-complete-cancelled-test');
  const listing_B9 = await seedListing(userB.id, 'B-for-complete-cancelled-test');
  {
    // Rejected branch
    const createdRej = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B8._id.toString(), offeredListingId: listing_A8._id.toString() },
    });
    const rejSwapId = createdRej.data?.swapRequest?._id;
    if (rejSwapId) createdSwapRequestIds.push(rejSwapId);
    await apiRequest('PATCH', `/swaps/${rejSwapId}/reject`, { cookie: userB.cookie });
    const completeRej = await apiRequest('PATCH', `/swaps/${rejSwapId}/complete`, { cookie: userB.cookie });
    const rejDocAfter = await SwapRequest.findById(rejSwapId);

    // Cancelled branch
    const createdCan = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B9._id.toString(), offeredListingId: listing_A9._id.toString() },
    });
    const canSwapId = createdCan.data?.swapRequest?._id;
    if (canSwapId) createdSwapRequestIds.push(canSwapId);
    await apiRequest('PATCH', `/swaps/${canSwapId}/cancel`, { cookie: userA.cookie });
    const completeCan = await apiRequest('PATCH', `/swaps/${canSwapId}/complete`, { cookie: userA.cookie });
    const canDocAfter = await SwapRequest.findById(canSwapId);

    const pass =
      completeRej.status === 400 &&
      rejDocAfter?.status === 'rejected' &&
      completeCan.status === 400 &&
      canDocAfter?.status === 'cancelled';

    record(
      'Complete a rejected/cancelled request',
      '400 in both cases, statuses unchanged',
      `rejected-branch=${completeRej.status}/${rejDocAfter?.status}, cancelled-branch=${completeCan.status}/${canDocAfter?.status}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Unauthorized accept -> 403
  // ===================================================================
  const listing_A10 = await seedListing(userA.id, 'A-for-unauth-accept');
  const listing_B10 = await seedListing(userB.id, 'B-for-unauth-accept');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B10._id.toString(), offeredListingId: listing_A10._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    // C is neither the requester nor the owner of the requested listing.
    const attempt = await apiRequest('PATCH', `/swaps/${swapId}/accept`, { cookie: userC.cookie });
    const docAfter = await SwapRequest.findById(swapId);

    const pass = attempt.status === 403 && docAfter?.status === 'pending';
    record('Unauthorized accept', '403, remains pending', `${attempt.status}, status=${docAfter?.status}`, pass);
  }

  // ===================================================================
  // TEST: Unauthorized reject -> 403
  // ===================================================================
  const listing_A11 = await seedListing(userA.id, 'A-for-unauth-reject');
  const listing_B11 = await seedListing(userB.id, 'B-for-unauth-reject');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B11._id.toString(), offeredListingId: listing_A11._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    const attempt = await apiRequest('PATCH', `/swaps/${swapId}/reject`, { cookie: userC.cookie });
    const docAfter = await SwapRequest.findById(swapId);

    const pass = attempt.status === 403 && docAfter?.status === 'pending';
    record('Unauthorized reject', '403, remains pending', `${attempt.status}, status=${docAfter?.status}`, pass);
  }

  // ===================================================================
  // TEST: Unauthorized cancel -> 403
  // ===================================================================
  const listing_A12 = await seedListing(userA.id, 'A-for-unauth-cancel');
  const listing_B12 = await seedListing(userB.id, 'B-for-unauth-cancel');
  {
    const created = await apiRequest('POST', '/swaps', {
      cookie: userA.cookie,
      body: { requestedListingId: listing_B12._id.toString(), offeredListingId: listing_A12._id.toString() },
    });
    const swapId = created.data?.swapRequest?._id;
    if (swapId) createdSwapRequestIds.push(swapId);

    // B is the requestedListing's owner, not the requester - not authorized to cancel.
    const attempt = await apiRequest('PATCH', `/swaps/${swapId}/cancel`, { cookie: userB.cookie });
    const docAfter = await SwapRequest.findById(swapId);

    const pass = attempt.status === 403 && docAfter?.status === 'pending';
    record('Unauthorized cancel', '403, remains pending', `${attempt.status}, status=${docAfter?.status}`, pass);
  }

  // ===================================================================
  // TESTS 12 & 13: Valid accept, then valid completion, then verify
  // final listing state and marketplace visibility.
  // ===================================================================
  {
    const accept = await apiRequest('PATCH', `/swaps/${validSwapId}/accept`, { cookie: userB.cookie });
    const pass = accept.status === 200 && accept.data?.swapRequest?.status === 'accepted';
    record('Valid accept', '200, status accepted', `${accept.status}, status=${accept.data?.swapRequest?.status}`, pass);
  }

  {
    const complete = await apiRequest('PATCH', `/swaps/${validSwapId}/complete`, { cookie: userA.cookie });
    const pass = complete.status === 200 && complete.data?.swapRequest?.status === 'completed';
    record('Valid completion', '200, status completed', `${complete.status}, status=${complete.data?.swapRequest?.status}`, pass);
  }

  {
    // Verify DB state directly.
    const listingA1After = await Listing.findById(listing_A1._id);
    const listingB1After = await Listing.findById(listing_B1._id);
    const dbPass = listingA1After.status === 'swapped' && listingB1After.status === 'swapped';

    // Verify the default marketplace view (status=available filter)
    // no longer includes either listing.
    const marketplace = await apiRequest('GET', '/listings');
    const marketplaceIds = (marketplace.data?.listings || []).map((l) => l._id);
    const notInMarketplace =
      !marketplaceIds.includes(listing_A1._id.toString()) && !marketplaceIds.includes(listing_B1._id.toString());

    const pass = dbPass && notInMarketplace;
    record(
      'Verify completed listings',
      'both listings swapped in DB and absent from default marketplace view',
      `listingA=${listingA1After.status}, listingB=${listingB1After.status}, hiddenFromMarketplace=${notInMarketplace}`,
      pass
    );
  }
}

// ---------------------------------------------------------------------
// Cleanup - runs no matter what, deletes ONLY IDs this run created
// ---------------------------------------------------------------------

async function cleanup() {
  console.log('\nCleaning up test data...');

  if (createdSwapRequestIds.length > 0) {
    await SwapRequest.deleteMany({ _id: { $in: createdSwapRequestIds } });
  }
  if (createdListingIds.length > 0) {
    await Listing.deleteMany({ _id: { $in: createdListingIds } });
  }
  if (createdUserIds.length > 0) {
    await User.deleteMany({ _id: { $in: createdUserIds } });
  }

  console.log(
    `Removed ${createdSwapRequestIds.length} swap request(s), ${createdListingIds.length} listing(s), ${createdUserIds.length} user(s).`
  );
}

function printSummary() {
  console.log('\n--- Phase 4 Test Results ---\n');
  console.log('Test Case'.padEnd(40) + 'Expected'.padEnd(45) + 'Actual'.padEnd(45) + 'Status');
  console.log('-'.repeat(150));
  for (const r of results) {
    console.log(
      r.name.padEnd(40).slice(0, 40) +
        String(r.expected).padEnd(45).slice(0, 45) +
        String(r.actual).padEnd(45).slice(0, 45) +
        (r.pass ? 'Passed' : 'FAILED')
    );
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('\nPassed:', passed);
  console.log('Failed:', failed);
  console.log('Total:', results.length);
}

(async () => {
  try {
    await main();
  } catch (err) {
    console.error('\nTest run aborted due to an unexpected error:');
    console.error(err);
  } finally {
    try {
      await cleanup();
    } catch (cleanupErr) {
      console.error('\nWARNING: cleanup did not fully complete:');
      console.error(cleanupErr);
      console.error('You may need to manually remove test data matching RUN_ID:', RUN_ID);
    }
    printSummary();
    await mongoose.disconnect();
    process.exit(results.some((r) => !r.pass) ? 1 : 0);
  }
})();
