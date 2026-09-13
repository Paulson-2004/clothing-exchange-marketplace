const mongoose = require('mongoose');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const SwapRequest = require('../src/models/SwapRequest');

async function main() {
  await mongoose.connect(process.env.TEST_MONGO_URI);
  
  // Seed Users
  const user1 = await User.create({ name: 'DelUser1', email: `del1_${Date.now()}@test.local`, passwordHash: 'hash' });
  const user2 = await User.create({ name: 'DelUser2', email: `del2_${Date.now()}@test.local`, passwordHash: 'hash' });

  // Seed Listings
  const listing1 = await Listing.create({ owner: user1._id, title: 'Del1', category: 'Tops', size: 'M', condition: 'New', brand: 'B', estimatedValue: 10, status: 'available' });
  const listing2 = await Listing.create({ owner: user2._id, title: 'Del2', category: 'Bottoms', size: 'M', condition: 'New', brand: 'B', estimatedValue: 10, status: 'available' });

  // Create accepted swap
  const swap = await SwapRequest.create({
    requester: user1._id,
    requestedListing: listing2._id,
    offeredListing: listing1._id,
    status: 'accepted'
  });
  
  listing1.status = 'pending';
  listing2.status = 'pending';
  await listing1.save();
  await listing2.save();

  // Now, call the delete endpoint logic by hitting the API
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
  const { generateToken } = require('../src/utils/generateToken') || { generateToken: (id, role) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id, role }, 'your_jwt_secret', { expiresIn: '30d' });
  }};
  
  const token = generateToken ? generateToken(user1._id, user1.role) : '';
  const fetch = require('node-fetch') || global.fetch; // using global fetch

  const response = await fetch(`${BASE_URL}/listings/${listing1._id}`, {
    method: 'DELETE',
    headers: { 'Cookie': `token=${token}` }
  });
  
  const data = await response.json();
  console.log('Delete Response:', data);

  // Check state
  const partnerListing = await Listing.findById(listing2._id);
  console.log('Partner Listing Status:', partnerListing.status);
  
  const updatedSwap = await SwapRequest.findById(swap._id);
  console.log('Swap Status:', updatedSwap.status);
  
  process.exit(0);
}
main().catch(console.error);
