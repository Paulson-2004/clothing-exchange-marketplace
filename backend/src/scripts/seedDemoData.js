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
    title: 'Nike Dri-FIT Legend Training T-Shirt',
    category: 'activewear',
    brand: 'Nike',
    size: 'M',
    condition: 'like-new',
    description: 'Clean white athletic training tee in lightweight moisture-wicking Dri-FIT fabric. Crewneck cut with clean hemline, worn twice for light workouts.',
    estimatedValue: 1200,
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'priya.patel@example.com',
    title: "Levi's 511 Slim Fit Jeans",
    category: 'bottoms',
    brand: "Levi's",
    size: 'L',
    condition: 'like-new',
    description: 'Classic dark indigo wash slim-fit denim jeans with subtle stretch. Clean structured finish with no distressing or fraying.',
    estimatedValue: 2200,
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'priya.patel@example.com',
    title: 'Zara Chambray Button-Down Casual Shirt',
    category: 'tops',
    brand: 'Zara',
    size: 'L',
    condition: 'like-new',
    description: 'Soft washed blue chambray button-down shirt with subtle micro-print and spread collar. Lightweight breathable cotton, perfect for smart-casual styling.',
    estimatedValue: 1800,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'H&M Relaxed Fit Cotton Crew Sweatshirt',
    category: 'outerwear',
    brand: 'H&M',
    size: 'XL',
    condition: 'good',
    description: 'Cozy relaxed-fit cotton fleece crewneck sweatshirt in vibrant warm pumpkin orange. Ribbed cuffs and hem with soft interior lining.',
    estimatedValue: 1500,
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Zara Faux-Leather Biker Jacket',
    category: 'outerwear',
    brand: 'Zara',
    size: 'M',
    condition: 'like-new',
    description: 'Edgy black moto-style faux-leather biker jacket with asymmetrical silver zip closure and lapel snaps. Clean interior lining with no scuffs.',
    estimatedValue: 2800,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Uniqlo Slim-Fit Oxford Cotton Shirt',
    category: 'tops',
    brand: 'Uniqlo',
    size: 'M',
    condition: 'like-new',
    description: 'Crisp white slim-fit Oxford cotton button-down shirt. Button-down collar and barrel cuffs, versatile for office wear or weekend layering.',
    estimatedValue: 1600,
    images: [
      'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Wildcraft Tactical Outdoor Cargo Trousers',
    category: 'bottoms',
    brand: 'Wildcraft',
    size: 'L',
    condition: 'good',
    description: 'Durable charcoal grey outdoor cargo trousers with multiple utility flap pockets and articulated knees. Ideal for trekking and travel.',
    estimatedValue: 2000,
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    ],
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
    description: 'Timeless mid-wash blue denim trucker jacket with brass button hardware and flap chest pockets. Authentic structured fit in excellent condition.',
    estimatedValue: 3200,
    images: [
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'ananya.iyer@example.com',
    title: 'FabIndia Chanderi Silk Saree',
    category: 'dresses',
    brand: 'FabIndia',
    size: 'One Size',
    condition: 'new',
    description: 'Traditional handcrafted Chanderi silk saree in royal deep purple with an ornate gold zari temple border and woven pallu. Unstitched blouse piece included.',
    estimatedValue: 1400,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    ],
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
    description: 'Tailored slim-fit stretch chinos in neutral khaki. Breathable cotton twill with button-tab waist, perfect for workplace or weekend wear.',
    estimatedValue: 2100,
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    ],
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
    description: 'Breezy white botanical floral wrap midi dress with tie-up waist, short flutter sleeves, and subtle side slit. Elegant resort and summer piece.',
    estimatedValue: 2500,
    images: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Nike Free RN Flyknit Running Shoes',
    category: 'footwear',
    brand: 'Nike',
    size: 'L',
    condition: 'like-new',
    description: 'Lightweight crimson red Nike Free Flyknit running shoes with white swoosh branding. Breathable engineered knit upper with flexible cushioned sole in excellent condition.',
    estimatedValue: 3200,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'vikram.malhotra@example.com',
    title: 'Vero Moda Bohemian Fringe Knit Poncho',
    category: 'outerwear',
    brand: 'Vero Moda',
    size: 'One Size',
    condition: 'like-new',
    description: 'Bohemian open-weave crochet knit poncho in neutral oatmeal cream with V-neckline and fringed hemline. Perfect lightweight layering piece for transitional weather.',
    estimatedValue: 1800,
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'rohan.verma@example.com',
    title: 'Ray-Ban Classic Wayfarer Sunglasses',
    category: 'accessories',
    brand: 'Ray-Ban',
    size: 'One Size',
    condition: 'like-new',
    description: 'Authentic Ray-Ban classic Wayfarer sunglasses in polished black acetate with polarized G-15 dark grey lenses. Features iconic silver temple rivets and signature Ray-Ban script.',
    estimatedValue: 4500,
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
    ],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    status: 'available',
  },
  {
    userEmail: 'aarav.sharma@example.com',
    title: 'Zara Cropped Graphic Cotton T-Shirt',
    category: 'tops',
    brand: 'Zara',
    size: 'M',
    condition: 'like-new',
    description: 'Boxy cropped crewneck graphic t-shirt in washed vintage black with white skeleton hand motif. Soft breathable 100% cotton jersey with clean distressed hems.',
    estimatedValue: 1000,
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
    ],
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

    // Remove obsolete demo listing titles for demo accounts to prevent duplicates upon re-seeding
    const obsoleteTitles = [
      'Nike Dri-FIT Running T-Shirt',
      'Zara Linen Casual Shirt',
      'H&M Relaxed Fit Cotton Hoodie',
      'Adidas Originals Track Jacket',
      'Uniqlo Oxford Cotton Shirt',
      'Puma Windbreaker Sports Jacket',
      'FabIndia Handblock Print Kurta',
      'Nike Air Zoom Pegasus Road Running Shoes',
      'Vero Moda Ribbed Knit Cardigan',
      'Ray-Ban Classic Gold Aviator Sunglasses',
      'Wildcraft Waterproof Hooded Trekking Jacket',
    ];
    await Listing.deleteMany({
      owner: { $in: Object.values(userMap).map((u) => u._id) },
      title: { $in: obsoleteTitles },
    });

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
        listing.category = item.category;
        listing.brand = item.brand;
        listing.size = item.size;
        listing.condition = item.condition;
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
    const itemA = listingMap['Nike Dri-FIT Legend Training T-Shirt'];
    const itemB = listingMap['FabIndia Chanderi Silk Saree'];
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
          text: 'Hi Ananya! I love your FabIndia Silk Saree. Would you be interested in swapping for my Nike training tee?',
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

