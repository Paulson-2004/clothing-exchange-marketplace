/**
 * Personal Profile & Marketplace Location Filter — Automated Integration Tests
 * ============================================================================
 * Tests:
 *   - Profile retrieval (authenticated 200, unauthenticated 401)
 *   - Profile data security (passwordHash never exposed)
 *   - Profile update (valid updates 200, invalid inputs 400, protected fields immutable)
 *   - Location filtering on marketplace listings (city, state, general location, combined filters)
 *   - Case-insensitivity & special character safety in location filters
 *   - Status filtering preservation (only available listings returned)
 *   - Phase 7 location-matching regression check
 *
 * Run with:
 *   cd backend && npm run test:profile-location
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SwapRequest = require('../src/models/SwapRequest');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();
const PLACEHOLDER_IMG = 'https://res.cloudinary.com/placeholder/image/upload/v1/profile-test.jpg';

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

async function registerUser(label, overrides = {}) {
  const email = `pl_${label}_${RUN_ID}@test.invalid`.toLowerCase();
  const res = await apiRequest('POST', '/auth/register', {
    body: {
      name: `User_${label}_${RUN_ID}`,
      email,
      password: 'testpass123',
      location: overrides.location || { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    },
  });
  if (res.status !== 201) throw new Error(`Failed to register user "${label}": ${res.status}`);
  const userId = res.data?.user?.id || res.data?.user?._id;
  if (userId) createdUserIds.push(userId.toString());
  return { id: userId.toString(), cookie: res.cookie, email, name: `User_${label}_${RUN_ID}` };
}

async function seedListing(ownerId, title, overrides = {}) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `${title}_${RUN_ID}`,
    category: overrides.category || 'tops',
    brand: overrides.brand || 'TestBrand',
    size: overrides.size || 'M',
    condition: overrides.condition || 'good',
    description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.',
    images: [PLACEHOLDER_IMG],
    estimatedValue: overrides.estimatedValue !== undefined ? overrides.estimatedValue : 1000,
    location: overrides.location || { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: overrides.status || 'available',
  });
  createdListingIds.push(listing._id.toString());
  return listing;
}

async function main() {
  console.log('====================================================');
  console.log('Profile & Location Filter — Integration Tests');
  console.log('====================================================');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for test fixtures.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    console.log('\nSetting up test users and listings...');
    const userA = await registerUser('userA', {
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    });
    const userB = await registerUser('userB', {
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    });

    // Seed listings across different locations and categories
    const listingBLR1 = await seedListing(userA.id, 'Nike Tee BLR', {
      category: 'tops',
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      status: 'available',
    });

    const listingBLR2 = await seedListing(userA.id, 'HM Hoodie BLR', {
      category: 'outerwear',
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      status: 'available',
    });

    const listingMUM1 = await seedListing(userB.id, 'Levis Jeans MUM', {
      category: 'bottoms',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      status: 'available',
    });

    const listingMUMPending = await seedListing(userB.id, 'Pending Dress MUM', {
      category: 'dresses',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      status: 'pending',
    });

    const listingDEL1 = await seedListing(userB.id, 'Adidas Track DEL', {
      category: 'outerwear',
      location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      status: 'available',
    });

    // Setup sample swap for activity tracking
    const swap = await SwapRequest.create({
      requester: userA.id,
      requestedListing: listingMUM1._id,
      offeredListing: listingBLR1._id,
      status: 'completed',
    });
    createdSwapRequestIds.push(swap._id.toString());

    console.log('Fixtures initialized successfully.\n');

    // ══════════════════════════════════════════════════════════════════
    // Suite 1: Personal Profile Functionality
    // ══════════════════════════════════════════════════════════════════
    console.log('--- Suite 1: Personal Profile ---');

    // 1. Unauthenticated profile access -> 401
    {
      const r = await apiRequest('GET', '/auth/profile');
      record('unauthenticated GET /auth/profile -> 401', 401, r.status, r.status === 401);
    }

    // 2. Authenticated user can fetch own profile
    {
      const r = await apiRequest('GET', '/auth/profile', { cookie: userA.cookie });
      const valid = Boolean(
        r.status === 200 &&
        r.data?.user?.email === userA.email &&
        typeof r.data?.activity?.totalListings === 'number' &&
        typeof r.data?.activity?.completedSwaps === 'number' &&
        Array.isArray(r.data?.recentSwaps)
      );
      record('authenticated GET /auth/profile -> 200 with activity data', true, valid, valid);
    }

    // 3. Password hash is never returned in profile
    {
      const r = await apiRequest('GET', '/auth/profile', { cookie: userA.cookie });
      const hasPassword = r.data?.user?.passwordHash !== undefined || r.data?.user?.password !== undefined;
      record('profile payload never returns passwordHash', false, hasPassword, hasPassword === false);
    }

    // 4. Unauthenticated PATCH /auth/profile -> 401
    {
      const r = await apiRequest('PATCH', '/auth/profile', {
        body: { name: 'New Name' },
      });
      record('unauthenticated PATCH /auth/profile -> 401', 401, r.status, r.status === 401);
    }

    // 5. Valid profile update
    {
      const r = await apiRequest('PATCH', '/auth/profile', {
        cookie: userA.cookie,
        body: {
          name: 'Aarav Updated',
          phone: '+91 99999 88888',
          bio: 'Passionate about sustainable fashion and swapping.',
          location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        },
      });
      const valid = Boolean(
        r.status === 200 &&
        r.data?.user?.name === 'Aarav Updated' &&
        r.data?.user?.phone === '+91 99999 88888' &&
        r.data?.user?.bio === 'Passionate about sustainable fashion and swapping.' &&
        r.data?.user?.location?.city === 'Bengaluru'
      );
      record('valid profile update succeeds -> 200', true, valid, valid);
    }

    // 6. Updating profile does NOT change email or role
    {
      const r = await apiRequest('PATCH', '/auth/profile', {
        cookie: userA.cookie,
        body: {
          email: 'hacked@test.invalid',
          role: 'admin',
        },
      });
      const safe = r.status === 200 && r.data?.user?.email === userA.email && r.data?.user?.role === 'user';
      record('protected fields (email, role) immutable via profile update', true, safe, safe);
    }

    // 7. Invalid empty name -> 400
    {
      const r = await apiRequest('PATCH', '/auth/profile', {
        cookie: userA.cookie,
        body: { name: '   ' },
      });
      record('empty name rejected -> 400', 400, r.status, r.status === 400);
    }

    // 8. Name exceeding 80 characters -> 400
    {
      const longName = 'A'.repeat(85);
      const r = await apiRequest('PATCH', '/auth/profile', {
        cookie: userA.cookie,
        body: { name: longName },
      });
      record('name > 80 chars rejected -> 400', 400, r.status, r.status === 400);
    }

    // 9. Bio exceeding 300 characters -> 400
    {
      const longBio = 'B'.repeat(310);
      const r = await apiRequest('PATCH', '/auth/profile', {
        cookie: userA.cookie,
        body: { bio: longBio },
      });
      record('bio > 300 chars rejected -> 400', 400, r.status, r.status === 400);
    }

    // ══════════════════════════════════════════════════════════════════
    // Suite 2: Explicit Marketplace Location Filtering
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- Suite 2: Marketplace Location Filtering ---');

    // 10. Filter by city=Bengaluru returns only Bengaluru items
    {
      const r = await apiRequest('GET', '/listings?city=Bengaluru');
      const allBengaluru = r.data?.listings?.length > 0 && r.data?.listings?.every(l => l.location?.city?.toLowerCase() === 'bengaluru');
      record('filter city=Bengaluru returns matching items', true, Boolean(allBengaluru), Boolean(allBengaluru));
    }

    // 11. Filter by state=Maharashtra returns only Maharashtra items
    {
      const r = await apiRequest('GET', '/listings?state=Maharashtra');
      const allMaharashtra = r.data?.listings?.length > 0 && r.data?.listings?.every(l => l.location?.state?.toLowerCase() === 'maharashtra');
      record('filter state=Maharashtra returns matching items', true, Boolean(allMaharashtra), Boolean(allMaharashtra));
    }

    // 12. General location parameter filter
    {
      const r = await apiRequest('GET', '/listings?location=Delhi');
      const allDelhi = r.data?.listings?.length > 0 && r.data?.listings?.every(l =>
        l.location?.city?.toLowerCase().includes('delhi') || l.location?.state?.toLowerCase().includes('delhi')
      );
      record('filter location=Delhi returns matching items', true, Boolean(allDelhi), Boolean(allDelhi));
    }

    // 13. Combined filter: category=outerwear & city=Bengaluru
    {
      const r = await apiRequest('GET', '/listings?category=outerwear&city=Bengaluru');
      const matches = r.data?.listings?.every(l => l.category === 'outerwear' && l.location?.city?.toLowerCase() === 'bengaluru');
      record('combined category and city filter returns intersection', true, Boolean(matches), Boolean(matches));
    }

    // 14. Case-insensitive location search
    {
      const r = await apiRequest('GET', '/listings?city=bengaluru');
      const count = r.data?.listings?.length;
      record('case-insensitive city search works (bengaluru)', true, count >= 2, count >= 2);
    }

    // 15. Non-matching location returns empty array (200)
    {
      const r = await apiRequest('GET', '/listings?city=NonExistentCity12345');
      const valid = r.status === 200 && r.data?.listings?.length === 0;
      record('non-matching location returns 200 with 0 items', true, valid, valid);
    }

    // 16. Excludes pending/swapped items from marketplace browse
    {
      const r = await apiRequest('GET', '/listings?city=Mumbai');
      const noPending = r.data?.listings?.every(l => l.status === 'available');
      record('marketplace browse excludes non-available items', true, Boolean(noPending), Boolean(noPending));
    }

    // 17. Phase 7 Location Matching regression test
    {
      const r = await apiRequest('GET', `/listings/${listingBLR1._id}/matches`);
      const valid = r.status === 200 && Array.isArray(r.data?.matches);
      record('regression: Phase 7 location matching remains functional', true, valid, valid);
    }

  } catch (err) {
    console.error('Unhandled error during test execution:', err);
    failed++;
  } finally {
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
    console.log('Cleanup completed.');
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(`Profile & Location Tests: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();


