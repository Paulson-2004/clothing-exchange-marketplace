/**
 * Phase 8 Admin Panel — Automated Integration Tests
 * ===================================================
 *
 * Tests the Phase 8 Admin Panel API endpoints:
 *   - Authentication & Access Control (401 unauthenticated, 403 non-admin, 200 admin)
 *   - Dashboard Statistics (GET /api/admin/stats)
 *   - User Management (GET /api/admin/users, GET /api/admin/users/:id, PATCH /api/admin/users/:id/role)
 *   - Listing Moderation (GET /api/admin/listings, DELETE /api/admin/listings/:id)
 *   - Swap Activity Monitoring (GET /api/admin/swaps)
 *   - Cascade & Invariant Protection (auto-cancels active swaps on listing deletion)
 *   - Regressions (Phase 4 swaps, Phase 5 chat, Phase 6 comparison, Phase 7 matching)
 *
 * Follows the established Phase 4/5/6/7 testing pattern:
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
 *   cd backend && npm run test:phase8
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SwapRequest = require('../src/models/SwapRequest');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();
const PLACEHOLDER_IMG = 'https://res.cloudinary.com/placeholder/image/upload/v1/phase8-test.jpg';

// --- Tracking arrays for cleanup ---
const createdUserIds = [];
const createdListingIds = [];
const createdSwapRequestIds = [];
const createdConversationIds = [];
const createdMessageIds = [];

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
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, cookie: extractTokenCookie(res) };
}

// ─── Fixture helpers ───────────────────────────────────────────────────────────

async function registerUser(label, location = {}) {
  const email = `p8_${label}_${RUN_ID}@test.invalid`.toLowerCase();
  const res = await apiRequest('POST', '/auth/register', {
    body: { name: `Phase8_${label}_${RUN_ID}`, email, password: 'testpass123', location },
  });
  if (res.status !== 201) throw new Error(`Failed to register user "${label}": ${res.status}`);
  const userId = res.data?.user?.id || res.data?.user?._id;
  if (userId) createdUserIds.push(userId.toString());
  return { id: userId.toString(), cookie: res.cookie, email, name: `Phase8_${label}_${RUN_ID}` };
}

async function createAdminUser(label) {
  const userObj = await registerUser(label);
  // Promote to admin directly in MongoDB
  await User.updateOne({ _id: userObj.id }, { $set: { role: 'admin' } });
  // Log in to get fresh token with role: 'admin'
  const loginRes = await apiRequest('POST', '/auth/login', {
    body: { email: userObj.email, password: 'testpass123' },
  });
  if (loginRes.status !== 200) throw new Error(`Failed to login admin user "${label}"`);
  userObj.cookie = loginRes.cookie;
  return userObj;
}

async function seedListing(ownerId, suffix, overrides = {}) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `P8_${suffix}_${RUN_ID}`,
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

// ─── Main Test Runner ──────────────────────────────────────────────────────────

async function main() {
  console.log('====================================================');
  console.log('Phase 8 Admin Panel — Automated Integration Tests');
  console.log('====================================================');

  try {
    if (!process.env.TEST_MONGO_URI) { console.error('FATAL'); process.exit(1); } await mongoose.connect(process.env.TEST_MONGO_URI); if (mongoose.connection.name !== 'rewear-automated-tests') { console.error('FATAL 2'); process.exit(1); }
    console.log('MongoDB connected for test fixtures.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    // ── Setup Users ──
    console.log('\nSetting up test users and fixtures...');
    const admin = await createAdminUser('admin');
    const regularUserA = await registerUser('userA', { city: 'Portland', state: 'OR' });
    const regularUserB = await registerUser('userB', { city: 'Portland', state: 'OR' });
    const regularUserC = await registerUser('userC', { city: 'Seattle', state: 'WA' });

    // ── Setup Listings ──
    const listingA1 = await seedListing(regularUserA.id, 'itemA1', { category: 'tops', estimatedValue: 60, status: 'available' });
    const listingA2 = await seedListing(regularUserA.id, 'itemA2', { category: 'bottoms', estimatedValue: 40, status: 'pending' });
    const listingB1 = await seedListing(regularUserB.id, 'itemB1', { category: 'outerwear', estimatedValue: 120, status: 'available' });
    const listingB2 = await seedListing(regularUserB.id, 'itemB2', { category: 'footwear', estimatedValue: 80, status: 'swapped' });
    const listingC1 = await seedListing(regularUserC.id, 'itemC1', { category: 'dresses', estimatedValue: 75, status: 'available' });

    // ── Setup Swaps ──
    const swap1 = await SwapRequest.create({
      requester: regularUserA.id,
      requestedListing: listingB1._id,
      offeredListing: listingA1._id,
      status: 'pending',
    });
    createdSwapRequestIds.push(swap1._id.toString());

    const swap2 = await SwapRequest.create({
      requester: regularUserB.id,
      requestedListing: listingC1._id,
      offeredListing: listingB2._id,
      status: 'completed',
    });
    createdSwapRequestIds.push(swap2._id.toString());

    // ── Setup Messages ──
    const sortedParticipants = [regularUserA.id, regularUserB.id].sort();
    const conv = await Conversation.create({
      participants: sortedParticipants,
      relatedSwapRequest: swap1._id,
    });
    createdConversationIds.push(conv._id.toString());

    const msg = await Message.create({
      conversation: conv._id,
      sender: regularUserA.id,
      text: 'Phase 8 test negotiation message',
      readBy: [regularUserA.id],
    });
    createdMessageIds.push(msg._id.toString());

    console.log('Fixtures initialized successfully.\n');

    // ══════════════════════════════════════════════════════════════════
    // Suite 1: Authentication & Access Control
    // ══════════════════════════════════════════════════════════════════
    console.log('--- Suite 1: Authentication & Access Control ---');

    // 1. Unauthenticated request to /admin/stats -> 401
    {
      const r = await apiRequest('GET', '/admin/stats');
      record('unauthenticated /admin/stats -> 401', 401, r.status, r.status === 401);
    }

    // 2. Regular user request to /admin/stats -> 403
    {
      const r = await apiRequest('GET', '/admin/stats', { cookie: regularUserA.cookie });
      record('regular user /admin/stats -> 403', 403, r.status, r.status === 403);
    }

    // 3. Regular user request to /admin/users -> 403
    {
      const r = await apiRequest('GET', '/admin/users', { cookie: regularUserA.cookie });
      record('regular user /admin/users -> 403', 403, r.status, r.status === 403);
    }

    // 4. Regular user request to /admin/users/:id -> 403
    {
      const r = await apiRequest('GET', `/admin/users/${regularUserA.id}`, { cookie: regularUserA.cookie });
      record('regular user /admin/users/:id -> 403', 403, r.status, r.status === 403);
    }

    // 5. Regular user request to PATCH /admin/users/:id/role -> 403
    {
      const r = await apiRequest('PATCH', `/admin/users/${regularUserB.id}/role`, { cookie: regularUserA.cookie });
      record('regular user role toggle -> 403', 403, r.status, r.status === 403);
    }

    // 6. Regular user request to /admin/listings -> 403
    {
      const r = await apiRequest('GET', '/admin/listings', { cookie: regularUserA.cookie });
      record('regular user /admin/listings -> 403', 403, r.status, r.status === 403);
    }

    // 7. Regular user request to DELETE /admin/listings/:id -> 403
    {
      const r = await apiRequest('DELETE', `/admin/listings/${listingA1._id}`, { cookie: regularUserA.cookie });
      record('regular user delete listing via admin endpoint -> 403', 403, r.status, r.status === 403);
    }

    // 8. Regular user request to /admin/swaps -> 403
    {
      const r = await apiRequest('GET', '/admin/swaps', { cookie: regularUserA.cookie });
      record('regular user /admin/swaps -> 403', 403, r.status, r.status === 403);
    }

    // 9. Admin request to /admin/stats -> 200
    {
      const r = await apiRequest('GET', '/admin/stats', { cookie: admin.cookie });
      record('admin /admin/stats -> 200', 200, r.status, r.status === 200);
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 2: Dashboard Statistics
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 2: Dashboard Statistics ---');

    {
      const r = await apiRequest('GET', '/admin/stats', { cookie: admin.cookie });
      const stats = r.data?.stats;

      // 10. Response contains expected schema
      const hasStructure = Boolean(
        stats &&
        typeof stats.users?.total === 'number' &&
        typeof stats.users?.admins === 'number' &&
        typeof stats.listings?.total === 'number' &&
        typeof stats.listings?.available === 'number' &&
        typeof stats.listings?.pending === 'number' &&
        typeof stats.listings?.swapped === 'number' &&
        typeof stats.swaps?.total === 'number' &&
        typeof stats.swaps?.pending === 'number' &&
        typeof stats.swaps?.accepted === 'number' &&
        typeof stats.swaps?.completed === 'number' &&
        typeof stats.messages?.total === 'number'
      );
      record('stats response has full expected structure', true, hasStructure, hasStructure);

      // 11. User counts reflect test fixtures
      record('stats.users.total >= 4', true, stats.users.total >= 4, stats.users.total >= 4);
      record('stats.users.admins >= 1', true, stats.users.admins >= 1, stats.users.admins >= 1);

      // 12. Listing breakdown adds up to total
      const listingsSum = stats.listings.available + stats.listings.pending + stats.listings.swapped;
      record('listings breakdown sum equals total', stats.listings.total, listingsSum, listingsSum === stats.listings.total);

      // 13. Swap breakdown adds up to total
      const swapsSum = stats.swaps.pending + stats.swaps.accepted + stats.swaps.rejected + stats.swaps.completed + stats.swaps.cancelled;
      record('swaps breakdown sum equals total', stats.swaps.total, swapsSum, swapsSum === stats.swaps.total);

      // 14. Message count is positive
      record('stats.messages.total >= 1', true, stats.messages.total >= 1, stats.messages.total >= 1);
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 3: User Management
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 3: User Management ---');

    // 15. List users returns paginated structure
    {
      const r = await apiRequest('GET', '/admin/users', { cookie: admin.cookie });
      const valid = Boolean(r.status === 200 && Array.isArray(r.data?.users) && r.data?.totalPages && r.data?.totalCount);
      record('list users returns paginated structure', true, valid, valid);
    }

    // 16. Password hashes are excluded from user results
    {
      const r = await apiRequest('GET', '/admin/users', { cookie: admin.cookie });
      const leakedPassword = r.data?.users?.some(u => u.passwordHash !== undefined || u.password !== undefined);
      record('password hashes excluded from user list', false, leakedPassword, leakedPassword === false);
    }

    // 17. Search users by name
    {
      const r = await apiRequest('GET', `/admin/users?search=userA`, { cookie: admin.cookie });
      const found = r.data?.users?.some(u => u.email === regularUserA.email);
      record('search users by name finds target user', true, Boolean(found), Boolean(found));
    }

    // 18. Search users by email
    {
      const r = await apiRequest('GET', `/admin/users?search=${regularUserB.email}`, { cookie: admin.cookie });
      const found = r.data?.users?.some(u => u.email === regularUserB.email);
      record('search users by email finds target user', true, Boolean(found), Boolean(found));
    }

    // 19. Filter users by role=admin
    {
      const r = await apiRequest('GET', '/admin/users?role=admin', { cookie: admin.cookie });
      const allAdmins = r.data?.users?.length > 0 && r.data?.users?.every(u => u.role === 'admin');
      record('filter role=admin returns only admins', true, Boolean(allAdmins), Boolean(allAdmins));
    }

    // 20. Filter users by role=user
    {
      const r = await apiRequest('GET', '/admin/users?role=user', { cookie: admin.cookie });
      const allUsers = r.data?.users?.length > 0 && r.data?.users?.every(u => u.role === 'user');
      record('filter role=user returns only regular users', true, Boolean(allUsers), Boolean(allUsers));
    }

    // 21. User list pagination limit
    {
      const r = await apiRequest('GET', '/admin/users?limit=2', { cookie: admin.cookie });
      record('pagination limit=2 returns at most 2 items', true, r.data?.users?.length <= 2, r.data?.users?.length <= 2);
    }

    // 22. Get single user details and activity summary
    {
      const r = await apiRequest('GET', `/admin/users/${regularUserA.id}`, { cookie: admin.cookie });
      const valid = Boolean(
        r.status === 200 &&
        r.data?.user?.email === regularUserA.email &&
        typeof r.data?.activity?.listingCount === 'number' &&
        typeof r.data?.activity?.swapCount === 'number' &&
        typeof r.data?.activity?.messageCount === 'number'
      );
      record('get single user returns profile + activity counts', true, valid, valid);
    }

    // 23. Get user with invalid ObjectId format -> 400
    {
      const r = await apiRequest('GET', '/admin/users/invalid-id-format', { cookie: admin.cookie });
      record('get user with invalid ID format -> 400', 400, r.status, r.status === 400);
    }

    // 24. Get nonexistent user -> 404
    {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const r = await apiRequest('GET', `/admin/users/${fakeId}`, { cookie: admin.cookie });
      record('get nonexistent user -> 404', 404, r.status, r.status === 404);
    }

    // 25. Toggle user role (user -> admin)
    {
      const r = await apiRequest('PATCH', `/admin/users/${regularUserC.id}/role`, { cookie: admin.cookie });
      record('toggle role user -> admin', 'admin', r.data?.user?.role, r.status === 200 && r.data?.user?.role === 'admin');
    }

    // 26. Toggle user role back (admin -> user)
    {
      const r = await apiRequest('PATCH', `/admin/users/${regularUserC.id}/role`, { cookie: admin.cookie });
      record('toggle role admin -> user', 'user', r.data?.user?.role, r.status === 200 && r.data?.user?.role === 'user');
    }

    // 27. Self-demotion is blocked -> 400
    {
      const r = await apiRequest('PATCH', `/admin/users/${admin.id}/role`, { cookie: admin.cookie });
      record('admin self-demotion blocked -> 400', 400, r.status, r.status === 400);
    }

    // 27a. Admin cannot delete themselves -> 400
    {
      const r = await apiRequest('DELETE', `/admin/users/${admin.id}`, { cookie: admin.cookie });
      record('admin self-deletion blocked -> 400', 400, r.status, r.status === 400);
    }

    // 27b. Admin cannot delete the last remaining admin -> 400
    {
      // Create a second admin just for this test
      const admin2 = await createAdminUser('admin2');
      // Demote them back to user so admin is the only one left
      await apiRequest('PATCH', `/admin/users/${admin2.id}/role`, { cookie: admin.cookie });
      
      const r = await apiRequest('DELETE', `/admin/users/${admin.id}`, { cookie: admin.cookie });
      record('admin cannot delete the last admin -> 400', 400, r.status, r.status === 400);
    }

    // 27c. Admin can delete a user
    {
      const toDelete = await registerUser('toDelete', { city: 'Test' });
      const r = await apiRequest('DELETE', `/admin/users/${toDelete.id}`, { cookie: admin.cookie });
      record('admin delete user -> 200', 200, r.status, r.status === 200);

      // Verify the user is anonymized, not hard deleted
      const dbUser = await User.findById(toDelete.id);
      record('user is anonymized to "Deleted User"', 'Deleted User', dbUser?.name, dbUser?.name === 'Deleted User');

      // 27d. Admin cannot delete an already-deleted user -> 400
      const rDelAgain = await apiRequest('DELETE', `/admin/users/${toDelete.id}`, { cookie: admin.cookie });
      record('admin delete already-deleted user blocked -> 400', 400, rDelAgain.status, rDelAgain.status === 400);

      // 27e. Admin cannot change role of a deleted user -> 400
      const rRoleAgain = await apiRequest('PATCH', `/admin/users/${toDelete.id}/role`, { cookie: admin.cookie });
      record('admin toggle role on deleted user blocked -> 400', 400, rRoleAgain.status, rRoleAgain.status === 400);
    }

    // 27f. Strict Regex Hardening for isDeletedUser
    {
      const { isDeletedUser } = require('../src/utils/accountUtils');
      const validAnonymized = { email: `deleted_1234567890123_${new mongoose.Types.ObjectId().toString()}@example.com` };
      const normalUser = { email: 'legit.user@gmail.com' };
      const prefixOnlyMatch = { email: 'deleted_foo@example.com' };
      const suffixOnlyMatch = { email: 'not_deleted_1234567890123_5f8d0a7b9d3e2a1b4c5d6e7f@example.com' };
      const oldVulnerableMatch = { email: 'deleted_foo@example.com', name: 'Deleted User' };

      record('isDeletedUser: valid anonymized matches', true, isDeletedUser(validAnonymized), isDeletedUser(validAnonymized) === true);
      record('isDeletedUser: normal user rejected', false, isDeletedUser(normalUser), isDeletedUser(normalUser) === false);
      record('isDeletedUser: prefix-only rejected', false, isDeletedUser(prefixOnlyMatch), isDeletedUser(prefixOnlyMatch) === false);
      record('isDeletedUser: suffix-only rejected', false, isDeletedUser(suffixOnlyMatch), isDeletedUser(suffixOnlyMatch) === false);
      record('isDeletedUser: old vulnerable format rejected', false, isDeletedUser(oldVulnerableMatch), isDeletedUser(oldVulnerableMatch) === false);
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 4: Listing Moderation
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 4: Listing Moderation ---');

    // 28. List all listings returns all statuses (available, pending, swapped)
    {
      const r = await apiRequest('GET', '/admin/listings', { cookie: admin.cookie });
      const statuses = new Set(r.data?.listings?.map(l => l.status));
      const hasMultipleStatuses = statuses.has('available') && (statuses.has('pending') || statuses.has('swapped'));
      record('admin listing list includes non-available listings', true, hasMultipleStatuses, hasMultipleStatuses);
    }

    // 29. Filter listings by status=available
    {
      const r = await apiRequest('GET', '/admin/listings?status=available', { cookie: admin.cookie });
      const allAvailable = r.data?.listings?.every(l => l.status === 'available');
      record('filter status=available returns available only', true, Boolean(allAvailable), Boolean(allAvailable));
    }

    // 30. Filter listings by status=pending
    {
      const r = await apiRequest('GET', '/admin/listings?status=pending', { cookie: admin.cookie });
      const allPending = r.data?.listings?.every(l => l.status === 'pending');
      record('filter status=pending returns pending only', true, Boolean(allPending), Boolean(allPending));
    }

    // 31. Filter listings by category
    {
      const r = await apiRequest('GET', '/admin/listings?category=outerwear', { cookie: admin.cookie });
      const allOuterwear = r.data?.listings?.every(l => l.category === 'outerwear');
      record('filter category=outerwear returns matching category', true, Boolean(allOuterwear), Boolean(allOuterwear));
    }

    // 32. Delete listing with invalid ID format -> 400
    {
      const r = await apiRequest('DELETE', '/admin/listings/invalid-id-format', { cookie: admin.cookie });
      record('admin delete listing invalid ID -> 400', 400, r.status, r.status === 400);
    }

    // 33. Delete nonexistent listing -> 404
    {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const r = await apiRequest('DELETE', `/admin/listings/${fakeId}`, { cookie: admin.cookie });
      record('admin delete nonexistent listing -> 404', 404, r.status, r.status === 404);
    }

    // 34. Admin delete listing succeeds and auto-cancels/rejects active swap
    {
      // listingA1 is in swap1 (pending) with listingB1
      const r = await apiRequest('DELETE', `/admin/listings/${listingA1._id}`, { cookie: admin.cookie });
      record('admin delete listing -> 200', 200, r.status, r.status === 200);

      // Verify listing is gone
      const dbListing = await Listing.findById(listingA1._id);
      record('listing removed from DB', null, dbListing, dbListing === null);

      // Verify swap1 was auto-rejected
      const dbSwap = await SwapRequest.findById(swap1._id);
      record('active swap referencing deleted listing auto-rejected', 'rejected', dbSwap?.status, dbSwap?.status === 'rejected');
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 5: Swap Activity Monitoring
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 5: Swap Activity Monitoring ---');

    // 35. List all swaps across all users (paginated)
    {
      const r = await apiRequest('GET', '/admin/swaps', { cookie: admin.cookie });
      const valid = Boolean(r.status === 200 && Array.isArray(r.data?.swaps) && r.data?.totalCount >= 2);
      record('admin swaps list returns all swaps across users', true, valid, valid);
    }

    // 36. Filter swaps by status=completed
    {
      const r = await apiRequest('GET', '/admin/swaps?status=completed', { cookie: admin.cookie });
      const allCompleted = r.data?.swaps?.length > 0 && r.data?.swaps?.every(s => s.status === 'completed');
      record('filter swaps status=completed returns completed only', true, Boolean(allCompleted), Boolean(allCompleted));
    }

    // 37. Swaps populate requester and listing information
    {
      const r = await apiRequest('GET', '/admin/swaps', { cookie: admin.cookie });
      const sampleSwap = r.data?.swaps?.find(s => s._id.toString() === swap2._id.toString());
      const hasPopulations = Boolean(
        sampleSwap &&
        sampleSwap.requester?.name &&
        sampleSwap.requestedListing?.title &&
        sampleSwap.offeredListing?.title
      );
      record('swaps populate requester and listings details', true, hasPopulations, hasPopulations);
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 6: Regressions (Phases 1–7)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 6: Regressions (Phases 1–7) ---');

    // 38. Phase 3: Regular user can still browse marketplace listings
    {
      const r = await apiRequest('GET', '/listings');
      record('regression: public listings browse still works', 200, r.status, r.status === 200);
    }

    // 39. Phase 4: Regular user can still create swap requests
    {
      const freshListingA = await seedListing(regularUserA.id, 'freshA');
      const freshListingB = await seedListing(regularUserB.id, 'freshB');
      const r = await apiRequest('POST', '/swaps', {
        cookie: regularUserA.cookie,
        body: {
          requestedListingId: freshListingB._id.toString(),
          offeredListingId: freshListingA._id.toString(),
        },
      });
      if (r.data?.swapRequest?._id) createdSwapRequestIds.push(r.data.swapRequest._id);
      record('regression: Phase 4 swap creation still works', 201, r.status, r.status === 201);
    }

    // 40. Phase 5: Regular user can still fetch conversation messages
    {
      const r = await apiRequest('GET', `/chat/conversations/${conv._id}/messages`, {
        cookie: regularUserA.cookie,
      });
      record('regression: Phase 5 chat message fetch still works', 200, r.status, r.status === 200);
    }

    // 41. Phase 6: Swap Value Comparator endpoint still works
    {
      const r = await apiRequest('GET', `/listings/compare?listingA=${listingB1._id}&listingB=${listingC1._id}`);
      const valid = r.status === 200 && r.data?.comparison?.classification !== undefined;
      record('regression: Phase 6 value comparison still works', true, valid, valid);
    }

    // 42. Phase 7: Location-Based Matching endpoint still works
    {
      const r = await apiRequest('GET', `/listings/${listingB1._id}/matches`);
      const valid = r.status === 200 && Array.isArray(r.data?.matches);
      record('regression: Phase 7 location matching still works', true, valid, valid);
    }

    // 43. Security: Admin endpoint does NOT expose chat messages
    {
      // No /api/admin/chat endpoint should exist (not found -> 404)
      const r = await apiRequest('GET', '/admin/chat', { cookie: admin.cookie });
      record('privacy: no admin chat endpoint exists -> 404', 404, r.status, r.status === 404);
    }

  } catch (err) {
    console.error('Unhandled error during test execution:', err);
    failed++;
  } finally {
    // ─── Cleanup Test Data ───────────────────────────────────────────
    console.log('\nCleaning up Phase 8 test fixtures...');
    if (createdMessageIds.length > 0) {
      await Message.deleteMany({ _id: { $in: createdMessageIds } });
    }
    if (createdConversationIds.length > 0) {
      await Conversation.deleteMany({ _id: { $in: createdConversationIds } });
    }
    if (createdSwapRequestIds.length > 0) {
      await SwapRequest.deleteMany({ _id: { $in: createdSwapRequestIds } });
    }
    if (createdListingIds.length > 0) {
      await Listing.deleteMany({ _id: { $in: createdListingIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    console.log('Cleanup completed.');
    await mongoose.disconnect();
  }

  // ─── Print Final Summary ──────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`Phase 8 Tests Summary: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();


