/**
 * Realistic Demo Data Seeder for Clothing Exchange & Swap Marketplace
 * ===================================================================
 * Seeds realistic Indian users, clothing listings, and swap activity.
 *
 * Run with:
 *   cd backend && npm run seed:demo
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const DEMO_PASSWORD = 'password123';

const DEMO_USERS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98201 12345',
    bio: 'Passionate about sustainable fashion and minimalist streetwear. Usually size M or L.',
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    role: 'user',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 98202 23456',
    bio: 'Upcycling enthusiast. Trading contemporary casuals and ethnic party wear. Size S/M.',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    role: 'user',
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 98203 34567',
    bio: 'Runner and fitness freak. Exchanging activewear, sports jackets, and sneakers.',
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    role: 'user',
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    phone: '+91 98204 45678',
    bio: 'Lover of breathable cottons, linen shirts, and floral midi dresses. Size M.',
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    role: 'user',
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    phone: '+91 98205 56789',
    bio: 'Denim collector and vintage clothing fan. Looking for quality jackets and boots.',
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    role: 'user',
  },
];

const DEMO_LISTINGS = [
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Nike Dri-FIT Running T-Shirt',
    category: 'activewear',
    brand: 'Nike',
    size: 'M',
    condition: 'like-new',
    description: 'Breathable moisture-wicking Dri-FIT tee in midnight blue. Worn twice for light jogs.',
    estimatedValue: 1200,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/nike-drifit.jpg'],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'priya.patel@example.com',
    title: "Levi's 511 Slim Fit Jeans",
    category: 'bottoms',
    brand: "Levi's",
    size: 'L',
    condition: 'good',
    description: 'Classic dark indigo wash denim with slight stretch. Excellent condition with no fraying.',
    estimatedValue: 2200,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/levis-511.jpg'],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'priya.patel@example.com',
    title: 'Zara Linen Casual Shirt',
    category: 'tops',
    brand: 'Zara',
    size: 'L',
    condition: 'new',
    description: 'Brand new 100% pure linen button-down shirt in olive green. Tags still attached.',
    estimatedValue: 1800,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/zara-linen.jpg'],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'H&M Relaxed Fit Cotton Hoodie',
    category: 'outerwear',
    brand: 'H&M',
    size: 'XL',
    condition: 'good',
    description: 'Cozy heavyweight cotton fleece pullover in heather grey. Soft interior with drawstring hood.',
    estimatedValue: 1500,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/hm-hoodie.jpg'],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Adidas Originals Track Jacket',
    category: 'outerwear',
    brand: 'Adidas',
    size: 'M',
    condition: 'like-new',
    description: 'Iconic 3-Stripes retro track jacket in black and white. Full front zipper and ribbed cuffs.',
    estimatedValue: 2800,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/adidas-track.jpg'],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Uniqlo Oxford Cotton Shirt',
    category: 'tops',
    brand: 'Uniqlo',
    size: 'M',
    condition: 'like-new',
    description: 'Crisp Oxford cotton button-down in sky blue. Great smart-casual essential.',
    estimatedValue: 1600,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/uniqlo-oxford.jpg'],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Puma Windbreaker Sports Jacket',
    category: 'activewear',
    brand: 'Puma',
    size: 'L',
    condition: 'good',
    description: 'Lightweight weather-resistant windrunner with zip pockets and reflective accents.',
    estimatedValue: 2000,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/puma-windbreaker.jpg'],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'vikram.malhotra@example.com',
    title: "Levi's Classic Denim Trucker Jacket",
    category: 'outerwear',
    brand: "Levi's",
    size: 'L',
    condition: 'like-new',
    description: 'Timeless mid-wash blue denim jacket with brass button hardware. Rugged and authentic.',
    estimatedValue: 3200,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/levis-jacket.jpg'],
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'ananya.iyer@example.com',
    title: 'FabIndia Handblock Print Kurta',
    category: 'tops',
    brand: 'FabIndia',
    size: 'M',
    condition: 'new',
    description: 'Traditional artisan handblock indigo print straight kurta. 100% breathable organic cotton.',
    estimatedValue: 1400,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/fabindia-kurta.jpg'],
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Marks & Spencer Chino Trousers',
    category: 'bottoms',
    brand: 'Marks & Spencer',
    size: 'M',
    condition: 'like-new',
    description: 'Tailored slim-fit stretch chinos in neutral khaki. Perfect for workplace or weekend wear.',
    estimatedValue: 2100,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/ms-chinos.jpg'],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'priya.patel@example.com',
    title: 'Mango Floral Wrap Midi Dress',
    category: 'dresses',
    brand: 'Mango',
    size: 'S',
    condition: 'new',
    description: 'Breezy botanical print midi dress with tie-up waist and V-neckline. Elegant and chic.',
    estimatedValue: 2500,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/mango-dress.jpg'],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Nike Air Zoom Pegasus Road Running Shoes',
    category: 'footwear',
    brand: 'Nike',
    size: 'L',
    condition: 'good',
    description: 'Responsive cushioned road runners with engineered mesh upper. Tread in solid shape.',
    estimatedValue: 3500,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/nike-pegasus.jpg'],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'vikram.malhotra@example.com',
    title: 'Vero Moda Ribbed Knit Cardigan',
    category: 'outerwear',
    brand: 'Vero Moda',
    size: 'M',
    condition: 'like-new',
    description: 'Soft textured ribbed cardigan in beige melange. Tortoiseshell button closure.',
    estimatedValue: 1900,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/veromoda-knit.jpg'],
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Ray-Ban Classic Gold Aviator Sunglasses',
    category: 'accessories',
    brand: 'Ray-Ban',
    size: 'One Size',
    condition: 'like-new',
    description: 'Classic teardrop aviators with crystal green G-15 lenses and gold metal frame. Includes leather case.',
    estimatedValue: 4500,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/rayban-aviator.jpg'],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Wildcraft Waterproof Hooded Trekking Jacket',
    category: 'outerwear',
    brand: 'Wildcraft',
    size: 'XL',
    condition: 'good',
    description: 'Seam-sealed all-weather hiking shell with adjustable storm hood and breathable mesh lining.',
    estimatedValue: 2600,
    images: ['https://res.cloudinary.com/clothing-exchange/image/upload/v1/demo/wildcraft-jacket.jpg'],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
];

async function seedDemoData() {
  console.log('====================================================');
  console.log('Seeding Realistic Clothing Demo Data');
  console.log('====================================================');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, salt);

    // 1. Seed Demo Users
    console.log('\n--- 1. Seeding Demo Users ---');
    const userMap = {};

    for (const u of DEMO_USERS) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          phone: u.phone,
          bio: u.bio,
          location: u.location,
          role: u.role,
        });
        console.log(`Created demo user: ${u.name} (${u.email}) [${u.location.city}, ${u.location.state}]`);
      } else {
        user.phone = u.phone;
        user.bio = u.bio;
        user.location = u.location;
        await user.save();
        console.log(`Updated demo user: ${u.name} (${u.email})`);
      }
      userMap[u.email] = user;
    }

    // 2. Seed Realistic Listings
    console.log('\n--- 2. Seeding Realistic Clothing Listings ---');
    const listingMap = {};

    for (const item of DEMO_LISTINGS) {
      const owner = userMap[item.userEmail];
      if (!owner) continue;

      let listing = await Listing.findOne({ owner: owner._id, title: item.title });
      if (!listing) {
        listing = await Listing.create({
          owner: owner._id,
          title: item.title,
          category: item.category,
          brand: item.brand,
          size: item.size,
          condition: item.condition,
          description: item.description,
          estimatedValue: item.estimatedValue,
          images: item.images,
          location: item.location,
          status: item.status,
        });
        console.log(`Created listing: "${item.title}" — ₹${item.estimatedValue} (${item.brand}, Size ${item.size})`);
      } else {
        listing.estimatedValue = item.estimatedValue;
        listing.description = item.description;
        listing.location = item.location;
        listing.images = item.images;
        await listing.save();
        console.log(`Updated listing: "${item.title}"`);
      }
      listingMap[item.title] = listing;
    }

    // 3. Seed Sample Completed & Pending Swaps for Rich Activity
    console.log('\n--- 3. Seeding Realistic Swap Activity ---');
    const itemA = listingMap['Nike Dri-FIT Running T-Shirt'];
    const itemB = listingMap['FabIndia Handblock Print Kurta'];
    const userA = userMap['aarav.sharma@example.com'];
    const userD = userMap['ananya.iyer@example.com'];

    if (itemA && itemB && userA && userD) {
      const existingSwap = await SwapRequest.findOne({
        requester: userA._id,
        requestedListing: itemB._id,
        offeredListing: itemA._id,
      });

      if (!existingSwap) {
        const swap = await SwapRequest.create({
          requester: userA._id,
          requestedListing: itemB._id,
          offeredListing: itemA._id,
          status: 'completed',
        });
        console.log(`Created sample completed swap: Aarav ("${itemA.title}") ↔ Ananya ("${itemB.title}")`);

        // Sample conversation
        const sorted = [userA._id, userD._id].sort();
        const conv = await Conversation.create({
          participants: sorted,
          relatedSwapRequest: swap._id,
        });

        await Message.create({
          conversation: conv._id,
          sender: userA._id,
          text: 'Hi Ananya! I love the FabIndia Kurta. Would you be interested in swapping for my Nike Dri-FIT tee?',
          readBy: [userA._id, userD._id],
        });

        await Message.create({
          conversation: conv._id,
          sender: userD._id,
          text: 'Hi Aarav! That sounds great, values are very close. Happy to accept!',
          readBy: [userA._id, userD._id],
        });
        console.log('Created sample conversation and message thread.');
      }
    }

    console.log('\n====================================================');
    console.log('Realistic Demo Data Seed Completed Successfully!');
    console.log(`- ${DEMO_USERS.length} Demo Users Seeded`);
    console.log(`- ${DEMO_LISTINGS.length} Realistic Clothing Listings Seeded`);
    console.log('====================================================');
  } catch (err) {
    console.error('Error seeding demo data:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedDemoData();

