/**
 * Marketplace Pagination API - Focused Integration Tests
 * =======================================================
 *
 * This follows the existing backend test convention:
 * - real HTTP requests go to TEST_BASE_URL;
 * - fixtures are created in the dedicated TEST_MONGO_URI database;
 * - only exact IDs created by this run are removed during cleanup.
 *
 * Run with:
 *   cd backend && npm run test:marketplace-pagination
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Listing = require('../src/models/Listing');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();
const TEST_DESCRIPTION = 'This is an automated marketplace pagination listing description with enough words to satisfy the application validation requirements for test fixtures and integration coverage. It intentionally includes additional ordinary words so the model validation threshold is always met.';
const PLACEHOLDER_IMAGE = 'https://example.com/marketplace-pagination-test-image.jpg';
const FIXED_CREATED_AT = new Date('2020-01-01T00:00:00.000Z');

const createdUserIds = [];
const createdListingIds = [];
const results = [];

function record(name, pass, actual) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${actual ? ` -> ${actual}` : ''}`);
}

function queryString(params) {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
}

async function apiRequest(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Keep the raw status available for useful failure output.
  }
  return { status: response.status, data };
}

async function registerTestUser() {
  const email = `marketplace-pagination-${RUN_ID}@test.invalid`;
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Marketplace Pagination ${RUN_ID}`,
      email,
      password: 'TestPass123!',
    }),
  });

  const data = await response.json();
  if (response.status !== 201 || !data?.user?.id) {
    throw new Error(`Failed to create pagination test user: status=${response.status}`);
  }

  createdUserIds.push(data.user.id.toString());
  return data.user.id.toString();
}

async function seedListing(ownerId, suffix, overrides = {}) {
  const listing = await Listing.create({
    owner: ownerId,
    title: `PG ${RUN_ID} ${suffix}`,
    category: 'tops',
    brand: 'Pagination Test Brand',
    size: 'M',
    condition: 'good',
    description: TEST_DESCRIPTION,
    images: [PLACEHOLDER_IMAGE],
    estimatedValue: 50,
    location: {
      city: `Pagination City ${RUN_ID}`,
      state: 'Pagination State',
      country: 'Testland',
    },
    status: 'available',
    ...overrides,
  });

  createdListingIds.push(listing._id.toString());
  return listing;
}

function listingIds(data) {
  return (data?.listings || []).map((listing) => listing._id.toString());
}

async function expectedIds(filter, skip, limit) {
  const listings = await Listing.find(filter)
    .select('_id')
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return listings.map((listing) => listing._id.toString());
}

async function cleanup() {
  if (createdListingIds.length > 0) {
    await Listing.deleteMany({ _id: { $in: createdListingIds } });
  }
  if (createdUserIds.length > 0) {
    const User = require('../src/models/User');
    await User.deleteMany({ _id: { $in: createdUserIds } });
  }
}

async function main() {
  let connected = false;

  try {
    if (!process.env.TEST_MONGO_URI) {
      throw new Error('TEST_MONGO_URI is required; refusing to run pagination fixtures elsewhere.');
    }

    await mongoose.connect(process.env.TEST_MONGO_URI);
    connected = true;
    if (mongoose.connection.name !== 'rewear-automated-tests') {
      throw new Error(`Connected to unexpected database: ${mongoose.connection.name}`);
    }
    await Listing.init();

    const ownerId = await registerTestUser();
    const allCity = `Pagination All ${RUN_ID}`;
    const filterCity = `Pagination Filter ${RUN_ID}`;
    const searchCity = `Pagination Search ${RUN_ID}`;
    const statusCity = `Pagination Status ${RUN_ID}`;
    const searchToken = `paginationsearch${RUN_ID}`;

    const allListingIds = [];
    for (let index = 1; index <= 55; index += 1) {
      const listing = await seedListing(ownerId, `all-${index}`, {
        category: index <= 30 ? 'outerwear' : 'tops',
        location: { city: allCity, state: 'Pagination State', country: 'Testland' },
      });
      allListingIds.push(listing._id.toString());
    }

    const filterListingIds = [];
    for (let index = 1; index <= 30; index += 1) {
      const listing = await seedListing(ownerId, `filter-${index}`, {
        category: 'outerwear',
        location: { city: filterCity, state: 'Pagination State', country: 'Testland' },
      });
      filterListingIds.push(listing._id.toString());
    }

    const searchListingIds = [];
    for (let index = 1; index <= 30; index += 1) {
      const listing = await seedListing(ownerId, `${searchToken} searchable-${index}`, {
        category: 'accessories',
        location: { city: searchCity, state: 'Pagination State', country: 'Testland' },
        brand: 'Search Pagination Brand',
      });
      searchListingIds.push(listing._id.toString());
    }

    const statusAvailableIds = [];
    for (let index = 1; index <= 3; index += 1) {
      const listing = await seedListing(ownerId, `status-available-${index}`, {
        location: { city: statusCity, state: 'Pagination State', country: 'Testland' },
      });
      statusAvailableIds.push(listing._id.toString());
    }
    const pendingListing = await seedListing(ownerId, 'status-pending', {
      location: { city: statusCity, state: 'Pagination State', country: 'Testland' },
      status: 'pending',
    });
    const swappedListing = await seedListing(ownerId, 'status-swapped', {
      location: { city: statusCity, state: 'Pagination State', country: 'Testland' },
      status: 'swapped',
    });

    // Force all fixtures to share a timestamp so the secondary _id sort is
    // exercised rather than merely inferred from naturally different times.
    await Listing.collection.updateMany(
      { _id: { $in: createdListingIds } },
      { $set: { createdAt: FIXED_CREATED_AT, updatedAt: FIXED_CREATED_AT } }
    );

    const allFilter = { status: 'available', 'location.city': allCity };
    const allQuery = queryString({ city: allCity });
    const page1 = await apiRequest(`/listings?${allQuery}`);
    const page1Ids = listingIds(page1.data);
    const expectedAllCount = allListingIds.length;

    record('Default pagination HTTP success', page1.status === 200, `status=${page1.status}`);
    record('Default limit is 24', page1.data?.limit === 24, `limit=${page1.data?.limit}`);
    record('Default page is 1', page1.data?.page === 1, `page=${page1.data?.page}`);
    record('Default page contains at most 24 listings', page1Ids.length <= 24, `items=${page1Ids.length}`);
    record('Default count equals matching listings', page1.data?.count === expectedAllCount, `count=${page1.data?.count}`);
    record('Default totalPages is correct', page1.data?.totalPages === 3, `totalPages=${page1.data?.totalPages}`);

    const page2 = await apiRequest(`/listings?${queryString({ city: allCity, page: 2, limit: 24 })}`);
    const page2Ids = listingIds(page2.data);
    const page3 = await apiRequest(`/listings?${queryString({ city: allCity, page: 3, limit: 24 })}`);
    const page3Ids = listingIds(page3.data);
    const expectedPage1Ids = await expectedIds(allFilter, 0, 24);
    const expectedPage2Ids = await expectedIds(allFilter, 24, 24);
    const expectedPage3Ids = await expectedIds(allFilter, 48, 24);

    record('Page 2 reports page 2', page2.status === 200 && page2.data?.page === 2, `page=${page2.data?.page}`);
    record('Page 2 contains the next ordered set', JSON.stringify(page2Ids) === JSON.stringify(expectedPage2Ids), `items=${page2Ids.length}`);
    record('Page 1 and page 2 have no duplicate IDs', page1Ids.every((id) => !page2Ids.includes(id)), `page1=${page1Ids.length}, page2=${page2Ids.length}`);
    record('Page 1 contains 24 listings', page1Ids.length === 24, `items=${page1Ids.length}`);
    record('Page 2 contains 24 listings', page2Ids.length === 24, `items=${page2Ids.length}`);
    record('Page 3 contains the deterministic remainder', page3Ids.length === expectedPage3Ids.length && page3Ids.length === expectedAllCount - 48, `items=${page3Ids.length}`);
    record('Page 3 totalPages remains correct', page3.data?.totalPages === 3, `totalPages=${page3.data?.totalPages}`);

    const customLimit = await apiRequest(`/listings?${queryString({ city: allCity, limit: 10 })}`);
    record('Custom limit=10', customLimit.status === 200 && customLimit.data?.limit === 10 && listingIds(customLimit.data).length === 10 && customLimit.data?.totalPages === 6, `limit=${customLimit.data?.limit}, totalPages=${customLimit.data?.totalPages}`);

    const maxLimit = await apiRequest(`/listings?${queryString({ city: allCity, limit: 999 })}`);
    record('Maximum limit is capped at 50', maxLimit.status === 200 && maxLimit.data?.limit === 50 && listingIds(maxLimit.data).length === 50, `limit=${maxLimit.data?.limit}, items=${listingIds(maxLimit.data).length}`);

    const invalidPageCases = [
      ['missing page', await apiRequest(`/listings?${queryString({ city: allCity, limit: 10 })}`)],
      ['page=0', await apiRequest(`/listings?${queryString({ city: allCity, page: 0, limit: 10 })}`)],
      ['negative page', await apiRequest(`/listings?${queryString({ city: allCity, page: -2, limit: 10 })}`)],
      ['invalid page text', await apiRequest(`/listings?${queryString({ city: allCity, page: 'not-a-page', limit: 10 })}`)],
    ];
    for (const [label, response] of invalidPageCases) {
      record(`Invalid page handling: ${label}`, response.status === 200 && response.data?.page === 1 && listingIds(response.data).length === 10, `page=${response.data?.page}`);
    }

    const invalidLimitCases = [
      ['missing limit', await apiRequest(`/listings?${queryString({ city: allCity })}`), 24],
      ['invalid limit', await apiRequest(`/listings?${queryString({ city: allCity, limit: 'not-a-limit' })}`), 24],
      ['negative limit', await apiRequest(`/listings?${queryString({ city: allCity, limit: -4 })}`), 1],
      ['limit greater than 50', await apiRequest(`/listings?${queryString({ city: allCity, limit: 999 })}`), 50],
    ];
    for (const [label, response, expectedLimit] of invalidLimitCases) {
      record(`Invalid limit handling: ${label}`, response.status === 200 && response.data?.limit === expectedLimit && listingIds(response.data).length <= expectedLimit, `limit=${response.data?.limit}`);
    }

    const filterPage1 = await apiRequest(`/listings?${queryString({ city: filterCity, category: 'outerwear', page: 1, limit: 24 })}`);
    const filterPage2 = await apiRequest(`/listings?${queryString({ city: filterCity, category: 'outerwear', page: 2, limit: 24 })}`);
    const filterPage1Ids = listingIds(filterPage1.data);
    const filterPage2Ids = listingIds(filterPage2.data);
    record('Filters are applied before pagination', filterPage1.data?.count === filterListingIds.length && filterPage1.data?.totalPages === 2 && filterPage1Ids.length === 24 && filterPage2Ids.length === 6 && filterPage1Ids.every((id) => !filterPage2Ids.includes(id)), `count=${filterPage1.data?.count}, totalPages=${filterPage1.data?.totalPages}`);

    const searchPage1 = await apiRequest(`/listings?${queryString({ city: searchCity, search: searchToken, page: 1, limit: 10 })}`);
    const searchPage2 = await apiRequest(`/listings?${queryString({ city: searchCity, search: searchToken, page: 2, limit: 10 })}`);
    const searchPage3 = await apiRequest(`/listings?${queryString({ city: searchCity, search: searchToken, page: 3, limit: 10 })}`);
    const searchIds = [...listingIds(searchPage1.data), ...listingIds(searchPage2.data), ...listingIds(searchPage3.data)];
    record('Search + pagination', searchPage1.status === 200 && searchPage1.data?.count === searchListingIds.length && searchPage1.data?.totalPages === 3 && searchIds.length === searchListingIds.length && new Set(searchIds).size === searchIds.length, `count=${searchPage1.data?.count}, totalPages=${searchPage1.data?.totalPages}`);

    const statusResponse = await apiRequest(`/listings?${queryString({ city: statusCity })}`);
    const statusIds = listingIds(statusResponse.data);
    record('Default status filter excludes non-available listings', statusResponse.status === 200 && statusResponse.data?.count === statusAvailableIds.length && statusResponse.data?.totalPages === 1 && statusIds.length === statusAvailableIds.length && statusResponse.data.listings.every((listing) => listing.status === 'available') && !statusIds.includes(pendingListing._id.toString()) && !statusIds.includes(swappedListing._id.toString()), `count=${statusResponse.data?.count}, totalPages=${statusResponse.data?.totalPages}`);

    const emptyResponse = await apiRequest(`/listings?${queryString({ city: `No Such Pagination City ${RUN_ID}` })}`);
    record('Empty results preserve existing metadata behavior', emptyResponse.status === 200 && emptyResponse.data?.count === 0 && emptyResponse.data?.listings?.length === 0 && emptyResponse.data?.page === 1 && emptyResponse.data?.limit === 24 && emptyResponse.data?.totalPages === 1, `count=${emptyResponse.data?.count}, totalPages=${emptyResponse.data?.totalPages}`);

    const deterministicRepeat = await apiRequest(`/listings?${allQuery}`);
    record('Deterministic ordering with equal timestamps', JSON.stringify(page1Ids) === JSON.stringify(expectedPage1Ids) && JSON.stringify(page1Ids) === JSON.stringify(listingIds(deterministicRepeat.data)), `items=${page1Ids.length}`);
  } catch (error) {
    console.error(`ERROR  ${error.message}`);
    results.push({ name: 'Test runner completed without an exception', pass: false });
  } finally {
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error(`ERROR  cleanup failed: ${cleanupError.message}`);
      results.push({ name: 'Fixture cleanup', pass: false });
    }
    if (connected) await mongoose.disconnect();

    const passed = results.filter((result) => result.pass).length;
    const failed = results.length - passed;
    console.log(`\nMarketplace pagination tests: ${passed} passed, ${failed} failed.`);
    process.exitCode = failed === 0 ? 0 : 1;
  }
}

main();
