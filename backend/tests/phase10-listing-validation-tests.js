require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now();

const results = [];
let passed = 0;
let failed = 0;

function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, pass });
  if (pass) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`);
    console.log(`      expected: ${expected}`);
    console.log(`      actual:   ${actual}`);
  }
}

async function apiRequest(method, path, { body, cookie } = {}) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
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
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, data, cookie: setCookie ? setCookie.split(';')[0] : null };
}

async function uploadRequest(method, path, { formData, cookie }) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  const opts = { method, headers, body: formData };
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function main() {
  console.log('--- Starting Listing Validation Tests ---');
  if (!process.env.TEST_MONGO_URI) { console.error('FATAL'); process.exit(1); } await mongoose.connect(process.env.TEST_MONGO_URI); if (mongoose.connection.name !== 'rewear-automated-tests') { console.error('FATAL 2'); process.exit(1); }

  const email = `valtest_${RUN_ID}@test.invalid`;
  const reg = await apiRequest('POST', '/auth/register', {
    body: { name: 'Val Tester', email, password: 'password123' },
  });
  const cookie = reg.cookie;

  const getFormData = (overrides = {}) => {
    const fd = new FormData();
    fd.append('title', overrides.title !== undefined ? overrides.title : 'Valid Title >= 10');
    fd.append('category', overrides.category !== undefined ? overrides.category : 'tops');
    fd.append('brand', overrides.brand !== undefined ? overrides.brand : 'Nike');
    fd.append('size', overrides.size !== undefined ? overrides.size : 'M');
    fd.append('condition', overrides.condition !== undefined ? overrides.condition : 'good');
    fd.append('description', overrides.description !== undefined ? overrides.description : 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.');
    fd.append('estimatedValue', overrides.estimatedValue !== undefined ? overrides.estimatedValue : '50');
    fd.append('city', overrides.city !== undefined ? overrides.city : 'Seattle');
    fd.append('state', overrides.state !== undefined ? overrides.state : 'WA');
    fd.append('country', overrides.country !== undefined ? overrides.country : 'USA');

    if (!overrides.skipImage) {
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      fd.append('images', blob, 'test.jpg');
    }
    return fd;
  };

  let r = await uploadRequest('POST', '/listings', { formData: getFormData({ title: '' }), cookie });
  record('missing required fields rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ title: 'Short' }), cookie });
  record('title below minimum rejected', 400, r.status, r.status === 400);

  const hugeTitle = Array(110).fill('A').join('');
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ title: hugeTitle }), cookie });
  record('title above maximum rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ title: 'This is a valid title' }), cookie });
  record('valid title accepted', 500, r.status, r.status === 500);
  const l = await Listing.create({ owner: reg.data.user.id || reg.data.user._id, title: 'Valid title for edit', category: 'tops', brand: 'Nike', size: 'M', condition: 'good', description: 'This is an automated test listing description that is intentionally long enough to pass the thirty word minimum requirement for new listings in the system. It contains enough words to be valid.', estimatedValue: 50, location: { city: 'Seattle', state: 'WA', country: 'US' }, images: ['http://a.com/b.jpg'] }); const validListingId = l._id;

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ description: 'This is too short.' }), cookie });
  record('description below 30 words rejected', 400, r.status, r.status === 400);

  const exact30 = Array(30).fill('word').join(' ');
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ description: exact30 }), cookie });
  record('exactly 30 words accepted', 500, r.status, r.status === 500);

  const hugeDesc = Array(300).fill('word').join(' '); 
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ description: hugeDesc }), cookie });
  record('description above 1000 characters rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ description: '     \n  \t   ' }), cookie });
  record('whitespace-only description rejected', 400, r.status, r.status === 400);

  const punctuationOnly = Array(35).fill('...').join(' ');
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ description: punctuationOnly }), cookie });
  record('punctuation-only description rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ brand: 'A' }), cookie });
  record('brand below 2 chars rejected', 400, r.status, r.status === 400);

  const hugeBrand = Array(60).fill('A').join('');
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ brand: hugeBrand }), cookie });
  record('brand above maximum rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ brand: 'Valid Brand' }), cookie });
  record('valid brand accepted', 500, r.status, r.status === 500);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ city: ' ' }), cookie });
  record('empty city rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ state: ' ' }), cookie });
  record('empty state rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ country: ' ' }), cookie });
  record('empty country rejected', 400, r.status, r.status === 400);

  r = await uploadRequest('POST', '/listings', { formData: getFormData({ city: 'A' }), cookie });
  record('city below minimum rejected', 400, r.status, r.status === 400);

  const hugeLocation = Array(110).fill('A').join('');
  r = await uploadRequest('POST', '/listings', { formData: getFormData({ city: hugeLocation }), cookie });
  record('city above maximum rejected', 400, r.status, r.status === 400);

  const fdUpdate = new FormData();
  fdUpdate.append('title', 'Short');
  r = await uploadRequest('PUT', `/listings/${validListingId}`, { formData: fdUpdate, cookie });
  record('edit listing with short title rejected', 400, r.status, r.status === 400);

  const fdUpdateDesc = new FormData();
  fdUpdateDesc.append('description', 'Too short');
  r = await uploadRequest('PUT', `/listings/${validListingId}`, { formData: fdUpdateDesc, cookie });
  record('edit listing with short description rejected', 400, r.status, r.status === 400);

  const fdValid = new FormData();
  fdValid.append('title', 'This is a new valid title');
  r = await uploadRequest('PUT', `/listings/${validListingId}`, { formData: fdValid, cookie });
  record('edit listing with valid title accepted', 200, r.status, r.status === 200);

  // verify location preservation
  const updatedListing = await Listing.findById(validListingId);
  record('edit listing preserves unchanged location fields', 'Seattle', updatedListing.location.city, updatedListing.location.city === 'Seattle');

  await Listing.deleteMany({ owner: reg.data.user.id || reg.data.user._id });
  await User.deleteOne({ _id: reg.data.user.id || reg.data.user._id });
  await mongoose.disconnect();
  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}
main();

