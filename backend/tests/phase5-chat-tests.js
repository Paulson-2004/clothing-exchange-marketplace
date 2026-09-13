/**
 * Phase 5 Chat API - Automated Integration Tests
 * =========================================================
 *
 * This script is intentionally SEPARATE from the application source
 * code, following the same approach as backend/tests/phase4-swap-tests.js.
 * It does not modify anything under backend/src except reading its
 * Mongoose models (used only for seeding test fixtures and independently
 * verifying database state - never for generating pass/fail verdicts).
 *
 * What this script actually tests:
 *   - Real HTTP requests are sent to your already-running backend at
 *     BASE_URL (default http://localhost:5000/api). This script does
 *     NOT start the server itself - run `npm run dev` in another
 *     terminal first.
 *   - Test users are created through the real POST /api/auth/register
 *     endpoint, and the httpOnly JWT cookie issued by that endpoint is
 *     captured and replayed on subsequent requests.
 *   - Test listings and a test swap request are seeded directly via
 *     Mongoose (bypassing Cloudinary and the swap-creation validation
 *     flow), since those are already covered by Phase 3/4 tests - here
 *     they are only fixture data supporting the chat authorization
 *     checks under test.
 *
 * Cleanup:
 *   Every User, Listing, SwapRequest, Conversation, and Message ID this
 *   script creates is tracked as it goes. In the `finally` block, ONLY
 *   those exact IDs are deleted. Nothing else in your database is ever
 *   touched.
 *
 * Requirements:
 *   - Node 18+ (uses the built-in global `fetch`)
 *   - Backend running locally on BASE_URL
 *   - backend/.env must have a working MONGO_URI
 *
 * Run with:
 *   cd backend
 *   node tests/phase5-chat-tests.js
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

// --- Tracking arrays for cleanup - ONLY these exact IDs get deleted ---
const createdUserIds = [];
const createdListingIds = [];
const createdSwapRequestIds = [];
const createdConversationIds = [];
const createdMessageIds = [];

// --- Test result bookkeeping ---
const results = [];

function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name} -> ${actual}`);
}

// ---------------------------------------------------------------------
// HTTP helpers (identical approach to phase4-swap-tests.js)
// ---------------------------------------------------------------------

function extractTokenCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  return setCookie.split(';')[0];
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
    // no JSON body - fine
  }

  return { status: response.status, data, rawResponse: response };
}

async function registerTestUser(label) {
  const email = `phase5test.${label}.${RUN_ID}@test.local`;
  const { status, data, rawResponse } = await apiRequest('POST', '/auth/register', {
    body: { name: `Phase5 Test ${label}`, email, password: 'TestPass123!' },
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

async function seedListing(ownerId, titleSuffix) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `PHASE5-TEST ${titleSuffix} ${RUN_ID}`,
    category: 'tops',
    brand: 'TestBrand',
    size: 'M',
    condition: 'good',
    description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
    images: ['https://example.com/placeholder-test-image.jpg'],
    estimatedValue: 20,
    location: { city: 'Test City', state: 'TS', country: 'Testland' },
    status: 'available',
  });
  createdListingIds.push(listing._id.toString());
  return listing;
}

// Seeds a swap request directly via Mongoose - the swap-creation flow
// itself is already covered by Phase 4 tests; here it is only fixture
// data supporting the chat-authorization checks under test.
async function seedSwapRequest(requesterId, requestedListingId, offeredListingId) {
  const swapRequest = await SwapRequest.create({
    requester: requesterId,
    requestedListing: requestedListingId,
    offeredListing: offeredListingId,
    status: 'pending',
  });
  createdSwapRequestIds.push(swapRequest._id.toString());
  return swapRequest;
}

// ---------------------------------------------------------------------
// Main test sequence
// ---------------------------------------------------------------------

async function main() {
  console.log('\nConnecting to MongoDB...');
  if (!process.env.TEST_MONGO_URI) { console.error('FATAL'); process.exit(1); } await mongoose.connect(process.env.TEST_MONGO_URI); if (mongoose.connection.name !== 'rewear-automated-tests') { console.error('FATAL 2'); process.exit(1); }
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

  // ===================================================================
  // TEST: Unauthenticated access is blocked
  // ===================================================================
  {
    const { status } = await apiRequest('GET', '/chat/conversations');
    record('Unauthenticated access blocked', '401', String(status), status === 401);
  }

  // ===================================================================
  // TEST: Self-conversation blocked
  // ===================================================================
  {
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: userA.id },
    });
    record('Self-conversation blocked', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Invalid otherUserId format
  // ===================================================================
  {
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: 'not-a-valid-object-id' },
    });
    record('Invalid otherUserId format', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Nonexistent otherUserId
  // ===================================================================
  {
    const fakeButValidId = new mongoose.Types.ObjectId().toString();
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: fakeButValidId },
    });
    record('Nonexistent otherUserId', '404', String(status), status === 404);
  }

  // ===================================================================
  // TEST: Create conversation (A -> B, no swap request)
  // ===================================================================
  let conversationAB = null;
  {
    const { status, data } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: userB.id },
    });
    conversationAB = data?.conversation;
    if (conversationAB?._id) createdConversationIds.push(conversationAB._id);

    const pass = status === 201 && conversationAB?.otherParticipant?._id === userB.id;
    record('Create conversation', '201, otherParticipant is User B', `${status}, otherParticipant=${conversationAB?.otherParticipant?._id}`, pass);
  }

  // ===================================================================
  // TEST: Existing conversation reused (same pair, no swap request)
  // ===================================================================
  {
    const { status, data } = await apiRequest('POST', '/chat/conversations', {
      cookie: userB.cookie, // initiated from the other side this time
      body: { otherUserId: userA.id },
    });
    const pass = status === 200 && data?.conversation?._id === conversationAB?._id;
    record('Existing conversation reused', '200, same conversation ID', `${status}, id=${data?.conversation?._id}`, pass);
  }

  // ===================================================================
  // TEST: Send message
  // ===================================================================
  let firstMessageId = null;
  {
    const { status, data } = await apiRequest('POST', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userA.cookie,
      body: { text: 'Hello, is this still available?' },
    });
    firstMessageId = data?.message?._id;
    if (firstMessageId) createdMessageIds.push(firstMessageId);

    const pass = status === 201 && data?.message?.text === 'Hello, is this still available?';
    record('Send message', '201, message saved with correct text', `${status}, text="${data?.message?.text}"`, pass);
  }

  // ===================================================================
  // TEST: Empty message rejected
  // ===================================================================
  {
    const { status } = await apiRequest('POST', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userA.cookie,
      body: { text: '   ' },
    });
    record('Empty message rejected', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Excessively long message rejected
  // ===================================================================
  {
    const tooLong = 'a'.repeat(2001);
    const { status } = await apiRequest('POST', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userA.cookie,
      body: { text: tooLong },
    });
    record('Excessively long message rejected', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Multiple messages retrieved in chronological order
  // ===================================================================
  {
    const second = await apiRequest('POST', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userB.cookie,
      body: { text: 'Yes, still available!' },
    });
    if (second.data?.message?._id) createdMessageIds.push(second.data.message._id);

    const { status, data } = await apiRequest('GET', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userA.cookie,
    });

    const chronological =
      Array.isArray(data?.messages) &&
      data.messages.length >= 2 &&
      new Date(data.messages[0].createdAt) <= new Date(data.messages[1].createdAt);

    const pass = status === 200 && chronological;
    record(
      'Multiple messages in chronological order',
      '200, messages sorted oldest-first',
      `${status}, count=${data?.messages?.length}, chronological=${chronological}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Invalid conversation ID format
  // ===================================================================
  {
    const { status } = await apiRequest('GET', '/chat/conversations/not-a-valid-id/messages', { cookie: userA.cookie });
    record('Invalid conversation ID format', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Unauthorized read access (User C is not a participant)
  // ===================================================================
  {
    const { status } = await apiRequest('GET', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userC.cookie,
    });
    record('Unauthorized read access blocked', '403', String(status), status === 403);
  }

  // ===================================================================
  // TEST: Unauthorized send blocked (User C is not a participant)
  // ===================================================================
  {
    const { status } = await apiRequest('POST', `/chat/conversations/${conversationAB._id}/messages`, {
      cookie: userC.cookie,
      body: { text: 'I should not be able to send this.' },
    });
    record('Unauthorized send blocked', '403', String(status), status === 403);
  }

  // ===================================================================
  // TEST: Unread count reflects an unread message, then clears after
  // marking read
  // ===================================================================
  {
    // At this point, User A has sent messages and User B has sent one
    // reply. From User A's perspective, B's reply is unread.
    const before = await apiRequest('GET', '/chat/conversations', { cookie: userA.cookie });
    const convBefore = before.data?.conversations?.find((c) => c._id === conversationAB._id);
    const hadUnread = (convBefore?.unreadCount || 0) > 0;

    const markRead = await apiRequest('PATCH', `/chat/conversations/${conversationAB._id}/read`, {
      cookie: userA.cookie,
    });

    const after = await apiRequest('GET', '/chat/conversations', { cookie: userA.cookie });
    const convAfter = after.data?.conversations?.find((c) => c._id === conversationAB._id);
    const clearedAfter = (convAfter?.unreadCount || 0) === 0;

    const pass = hadUnread && markRead.status === 200 && clearedAfter;
    record(
      'Unread count clears after marking read',
      'unread > 0 before, 200 on mark-read, unread = 0 after',
      `before=${convBefore?.unreadCount}, markReadStatus=${markRead.status}, after=${convAfter?.unreadCount}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Unauthorized mark-read blocked (User C is not a participant)
  // ===================================================================
  {
    const { status } = await apiRequest('PATCH', `/chat/conversations/${conversationAB._id}/read`, {
      cookie: userC.cookie,
    });
    record('Unauthorized mark-read blocked', '403', String(status), status === 403);
  }

  // ===================================================================
  // TEST: Conversation with a swap request - valid party succeeds
  // ===================================================================
  const listing_A1 = await seedListing(userA.id, 'A-for-swap-chat');
  const listing_B1 = await seedListing(userB.id, 'B-for-swap-chat');
  const swapAB = await seedSwapRequest(userA.id, listing_B1._id, listing_A1._id);

  let conversationSwap = null;
  {
    const { status, data } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: userB.id, swapRequestId: swapAB._id.toString() },
    });
    conversationSwap = data?.conversation;
    if (conversationSwap?._id) createdConversationIds.push(conversationSwap._id);

    const pass = status === 201 && conversationSwap?.relatedSwapRequest?._id === swapAB._id.toString();
    record(
      'Conversation with swap request (valid party)',
      '201, relatedSwapRequest linked correctly',
      `${status}, relatedSwapRequest=${conversationSwap?.relatedSwapRequest?._id}`,
      pass
    );
  }

  // ===================================================================
  // TEST: Conversation with a swap request - uninvolved third party blocked
  // ===================================================================
  {
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userC.cookie,
      body: { otherUserId: userA.id, swapRequestId: swapAB._id.toString() },
    });
    record('Swap-linked conversation blocks uninvolved party', '403', String(status), status === 403);
  }

  // ===================================================================
  // TEST: Invalid swapRequestId format
  // ===================================================================
  {
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: userB.id, swapRequestId: 'not-a-valid-id' },
    });
    record('Invalid swapRequestId format', '400', String(status), status === 400);
  }

  // ===================================================================
  // TEST: Nonexistent swapRequestId
  // ===================================================================
  {
    const fakeButValidId = new mongoose.Types.ObjectId().toString();
    const { status } = await apiRequest('POST', '/chat/conversations', {
      cookie: userA.cookie,
      body: { otherUserId: userB.id, swapRequestId: fakeButValidId },
    });
    record('Nonexistent swapRequestId', '404', String(status), status === 404);
  }

  // ===================================================================
  // TEST: Conversation list shows correct summary info
  // ===================================================================
  {
    const { status, data } = await apiRequest('GET', '/chat/conversations', { cookie: userB.cookie });
    const found = data?.conversations?.find((c) => c._id === conversationAB._id);

    const pass =
      status === 200 &&
      found?.otherParticipant?._id === userA.id &&
      typeof found?.latestMessage?.text === 'string';

    record(
      'Conversation list summary is correct',
      '200, otherParticipant is User A, latestMessage has text',
      `${status}, otherParticipant=${found?.otherParticipant?._id}, latestMessageText="${found?.latestMessage?.text}"`,
      pass
    );
  }
}

// ---------------------------------------------------------------------
// Cleanup - runs no matter what, deletes ONLY IDs this run created
// ---------------------------------------------------------------------

async function cleanup() {
  console.log('\nCleaning up test data...');

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

  console.log(
    `Removed ${createdMessageIds.length} message(s), ${createdConversationIds.length} conversation(s), ${createdSwapRequestIds.length} swap request(s), ${createdListingIds.length} listing(s), ${createdUserIds.length} user(s).`
  );
}

function printSummary() {
  console.log('\n--- Phase 5 Test Results ---\n');
  console.log('Test Case'.padEnd(45) + 'Expected'.padEnd(45) + 'Actual'.padEnd(45) + 'Status');
  console.log('-'.repeat(160));
  for (const r of results) {
    console.log(
      r.name.padEnd(45).slice(0, 45) +
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


