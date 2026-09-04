require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SwapRequest = require('../src/models/SwapRequest');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();

// Cleanup tracking
const createdUserIds = [];
const createdListingIds = [];
const createdSwapRequestIds = [];

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

function extractTokenCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// Minimal fetch wrapper
async function api(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Cookie'] = `token=${token}`;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await response.json().catch(() => null);
  const newToken = extractTokenCookie(response);
  return { status: response.status, data, token: newToken, setCookie: response.headers.get('set-cookie') };
}

async function runTests() {
  console.log('\n--- Starting Account Management Tests ---\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // 1. Setup Data
    const r1 = await api('POST', '/auth/register', {
      name: `UserA ${RUN_ID}`,
      email: `usera_${RUN_ID}@example.com`,
      password: 'password123',
    });
    const userA = r1.data.user;
    const tokenA = r1.token;
    createdUserIds.push(userA.id);

    const r2 = await api('POST', '/auth/register', {
      name: `UserB ${RUN_ID}`,
      email: `userb_${RUN_ID}@example.com`,
      password: 'password123',
    });
    const userB = r2.data.user;
    const tokenB = r2.token;
    createdUserIds.push(userB.id);

    // 2. Change Password
    const badPass = await api('PUT', '/auth/password', { currentPassword: 'wrongpassword', newPassword: 'newpassword123' }, tokenA);
    record('Change password with wrong current password', 401, badPass.status, badPass.status === 401);

    const shortPass = await api('PUT', '/auth/password', { currentPassword: 'password123', newPassword: 'short' }, tokenA);
    record('Change password with short new password', 400, shortPass.status, shortPass.status === 400);

    const okPass = await api('PUT', '/auth/password', { currentPassword: 'password123', newPassword: 'newpassword123' }, tokenA);
    record('Change password successful', 200, okPass.status, okPass.status === 200);

    // After password change, cookie should be cleared
    const hasClearedCookie = okPass.setCookie && okPass.setCookie.includes('token=;');
    record('Change password clears cookie', true, !!hasClearedCookie, !!hasClearedCookie);

    // Re-login UserA
    const loginA = await api('POST', '/auth/login', { email: userA.email, password: 'newpassword123' });
    record('Login with new password', 200, loginA.status, loginA.status === 200);
    const newTokenA = loginA.token;

    // 3. Create Listings and Swaps
    // UserA Listing (Available)
    const listA1 = await Listing.create({
      owner: userA.id, title: 'Listing A1 Available', category: 'tops', brand: 'Nike', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', location: { city: 'Seattle', state: 'WA', country: 'USA' },
      images: ['img.jpg'], estimatedValue: 500, status: 'available'
    });
    createdListingIds.push(listA1._id);

    // UserA Listing (Pending)
    const listA2 = await Listing.create({
      owner: userA.id, title: 'Listing A2 Pending', category: 'tops', brand: 'Nike', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', location: { city: 'Seattle', state: 'WA', country: 'USA' },
      images: ['img.jpg'], estimatedValue: 500, status: 'pending'
    });
    createdListingIds.push(listA2._id);

    // UserB Listing (Available)
    const listB1 = await Listing.create({
      owner: userB.id, title: 'Listing B1 Available', category: 'tops', brand: 'Adidas', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', location: { city: 'Seattle', state: 'WA', country: 'USA' },
      images: ['img.jpg'], estimatedValue: 500, status: 'available'
    });
    createdListingIds.push(listB1._id);

    // UserB Listing (Available) for swap request from UserA
    const listB2 = await Listing.create({
      owner: userB.id, title: 'Listing B2 Available', category: 'tops', brand: 'Adidas', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', location: { city: 'Seattle', state: 'WA', country: 'USA' },
      images: ['img.jpg'], estimatedValue: 500, status: 'available'
    });
    createdListingIds.push(listB2._id);

    // Swap Request: B requests A's A2 offering B1
    const swapBA = await SwapRequest.create({
      requester: userB.id,
      requestedListing: listA2._id,
      offeredListing: listB1._id,
      status: 'pending'
    });
    createdSwapRequestIds.push(swapBA._id);

    const listA3 = await Listing.create({
      owner: userA.id, title: 'Listing A3 Available', category: 'tops', brand: 'Nike', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', location: { city: 'Seattle', state: 'WA', country: 'USA' },
      images: ['img.jpg'], estimatedValue: 500, status: 'available'
    });
    createdListingIds.push(listA3._id);

    const swapAB = await SwapRequest.create({
      requester: userA.id,
      requestedListing: listB2._id,
      offeredListing: listA3._id,
      status: 'pending'
    });
    createdSwapRequestIds.push(swapAB._id);

    // Let's create a conversation directly
    const conv = await Conversation.create({ participants: [userA.id, userB.id] });
    const msg = await Message.create({ conversation: conv._id, sender: userA.id, text: 'Hello' });

    // 4. Delete Account
    const delNoPass = await api('DELETE', '/auth/account', null, newTokenA);
    record('Delete account without password fails', 400, delNoPass.status, delNoPass.status === 400);

    const delBadPass = await api('DELETE', '/auth/account', { password: 'wrongpassword' }, newTokenA);
    record('Delete account with wrong password fails', 401, delBadPass.status, delBadPass.status === 401);

    const uA_before = await User.findById(userA.id);
    record('UserA not anonymized after failed deletion', userA.name, uA_before.name, uA_before.name === userA.name);

    const delAcc = await api('DELETE', '/auth/account', { password: 'newpassword123' }, newTokenA);
    record('Delete account successful with correct password', 200, delAcc.status, delAcc.status === 200);

    const hasClearedCookieDel = delAcc.setCookie && delAcc.setCookie.includes('token=;');
    record('Delete account clears cookie', true, !!hasClearedCookieDel, !!hasClearedCookieDel);

    // Verify UserA is anonymized
    const uA = await User.findById(userA.id);
    record('UserA name is Deleted User', 'Deleted User', uA.name, uA.name === 'Deleted User');
    record('UserA email is modified', true, uA.email !== userA.email, uA.email !== userA.email);

    // Verify Listings
    const listingsA = await Listing.find({ owner: userA.id });
    record('All available/pending listings for UserA are deleted', 0, listingsA.length, listingsA.length === 0);

    // Verify Counterparty listings restored to available
    const b1 = await Listing.findById(listB1._id);
    record('Counterparty listing B1 restored to available', 'available', b1.status, b1.status === 'available');

    const b2 = await Listing.findById(listB2._id);
    record('Counterparty listing B2 restored to available', 'available', b2.status, b2.status === 'available');

    // Verify Swaps
    const sBA = await SwapRequest.findById(swapBA._id);
    record('Swap request from B to A is cancelled', 'cancelled', sBA.status, sBA.status === 'cancelled');

    const sAB = await SwapRequest.findById(swapAB._id);
    record('Swap request from A to B is cancelled', 'cancelled', sAB.status, sAB.status === 'cancelled');

    // Verify Chat remains
    const convData = await api('GET', '/chat/conversations', null, tokenB);
    const foundConv = convData.data.conversations.find(c => c._id.toString() === conv._id.toString());
    record('Conversation still exists for B', true, !!foundConv, !!foundConv);
    record('Other participant is Deleted User', 'Deleted User', foundConv.otherParticipant.name, foundConv.otherParticipant.name === 'Deleted User');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    console.log('\n--- Cleanup ---');
    await SwapRequest.deleteMany({ _id: { $in: createdSwapRequestIds } });
    await Listing.deleteMany({ _id: { $in: createdListingIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    // Not cleaning chat for brevity, it's just test DB
    mongoose.disconnect();

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

