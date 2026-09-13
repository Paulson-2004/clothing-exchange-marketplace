/**
 * Safe, deterministic development-data seeder for ReWear.
 *
 * This script is intentionally limited to the local development database.
 * It uses only MONGO_URI, verifies the actual connected database name, and
 * fails closed before reading or writing records when that name is unsafe.
 *
 * Run from the repository root with:
 *   npm run seed:dev
 */

const path = require('path');

// Match the backend's existing environment-loading convention without
// printing any environment values or connection details.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const DEV_PASSWORD = process.env.REWEAR_DEV_SEED_PASSWORD || 'rewear-local-dev';

// The IDs are deterministic and are part of the seed's ownership boundary.
// They avoid title-based cleanup and let every related record be upserted
// without touching arbitrary documents in rewear-dev.
const USER_IDS = {
  admin: '66f000000000000000000001',
  aarav: '66f000000000000000000002',
  ananya: '66f000000000000000000003',
  rohan: '66f000000000000000000004',
  meera: '66f000000000000000000005',
  kabir: '66f000000000000000000006',
};

const LISTING_IDS = Array.from({ length: 18 }, (_, index) =>
  `66f1000000000000000000${String(index + 1).padStart(2, '0')}`
);

const SWAP_IDS = {
  completed: '66f200000000000000000001',
  accepted: '66f200000000000000000002',
};

const CONVERSATION_ID = '66f300000000000000000001';
const MESSAGE_IDS = ['66f400000000000000000001', '66f400000000000000000002'];

const DEV_USERS = [
  {
    _id: USER_IDS.admin,
    name: 'ReWear Local Admin',
    email: 'admin@rewear-dev.test',
    phone: '+91 90000 00001',
    bio: 'Development administrator account for testing the local ReWear dashboard, moderation tools, user management, and marketplace workflows safely.',
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    role: 'admin',
  },
  {
    _id: USER_IDS.aarav,
    name: 'Aarav Sharma',
    email: 'aarav@rewear-dev.test',
    phone: '+91 90000 00002',
    bio: 'Sustainable fashion enthusiast from Bengaluru who enjoys minimalist streetwear, practical basics, and well-kept athletic clothing.',
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    role: 'user',
  },
  {
    _id: USER_IDS.ananya,
    name: 'Ananya Iyer',
    email: 'ananya@rewear-dev.test',
    phone: '+91 90000 00003',
    bio: 'Chennai-based collector of breathable cottons, festive Indian textiles, floral dresses, and versatile pieces for warm weather.',
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    role: 'user',
  },
  {
    _id: USER_IDS.rohan,
    name: 'Rohan Verma',
    email: 'rohan@rewear-dev.test',
    phone: '+91 90000 00004',
    bio: 'Delhi runner and fitness enthusiast exchanging reliable activewear, comfortable trousers, and lightly used everyday sneakers.',
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    role: 'user',
  },
  {
    _id: USER_IDS.meera,
    name: 'Meera Nair',
    email: 'meera@rewear-dev.test',
    phone: '+91 90000 00005',
    bio: 'Mumbai creative who loves polished accessories, easy dresses, and timeless wardrobe pieces that can be exchanged responsibly.',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    role: 'user',
  },
  {
    _id: USER_IDS.kabir,
    name: 'Kabir Malhotra',
    email: 'kabir@rewear-dev.test',
    phone: '+91 90000 00006',
    bio: 'Pune resident and vintage clothing fan looking for quality outerwear, formal layers, travel essentials, and durable everyday basics.',
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    role: 'user',
  },
];

// These are already-used, public Unsplash image URLs from the existing demo
// data. Reusing them keeps seeding deterministic and avoids Cloudinary uploads
// or a new image service on every execution.
const EXISTING_PUBLIC_IMAGES = [
  'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1584865288642-42078afe6942?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
];

const DEV_LISTINGS = [
  {
    _id: LISTING_IDS[0], owner: USER_IDS.aarav, title: '[DEV-01] Nike Dri-FIT Training T-Shirt', category: 'activewear', brand: 'Nike', size: 'M', condition: 'like-new',
    description: 'Lightweight black Nike training T-shirt made from breathable moisture-wicking fabric. The regular athletic fit allows easy movement during gym sessions, evening walks, and weekend travel. Worn only a few times and carefully washed.',
    estimatedValue: 1200, image: EXISTING_PUBLIC_IMAGES[0], location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }, status: 'swapped',
  },
  {
    _id: LISTING_IDS[1], owner: USER_IDS.rohan, title: "[DEV-02] Levi's Slim Fit Denim Jeans", category: 'bottoms', brand: "Levi's", size: 'L', condition: 'like-new',
    description: 'Classic dark indigo Levi’s jeans with a comfortable slim fit, subtle stretch, and clean hemline. The denim has been worn carefully, shows no distressing, and works equally well with shirts, polos, or casual sneakers.',
    estimatedValue: 2200, image: EXISTING_PUBLIC_IMAGES[1], location: { city: 'Delhi', state: 'Delhi', country: 'India' }, status: 'pending',
  },
  {
    _id: LISTING_IDS[2], owner: USER_IDS.ananya, title: '[DEV-03] Zara Graphic Cotton T-Shirt', category: 'tops', brand: 'Zara', size: 'S', condition: 'good',
    description: 'Soft charcoal Zara graphic T-shirt with a relaxed crewneck shape and a subtle geometric front print. The breathable cotton fabric remains comfortable for everyday errands, college outfits, casual lunches, and layered seasonal styling.',
    estimatedValue: 900, image: EXISTING_PUBLIC_IMAGES[2], location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[3], owner: USER_IDS.kabir, title: "[DEV-04] Levi's Classic Denim Jacket", category: 'outerwear', brand: "Levi's", size: 'L', condition: 'like-new',
    description: 'Mid-wash Levi’s denim jacket with sturdy button hardware, two chest pockets, and a structured but comfortable fit. It has been worn lightly, stored carefully, and pairs well with dresses, chinos, or everyday denim.',
    estimatedValue: 3200, image: EXISTING_PUBLIC_IMAGES[3], location: { city: 'Pune', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[4], owner: USER_IDS.rohan, title: '[DEV-05] Nike Road Running Shoes', category: 'footwear', brand: 'Nike', size: 'XL', condition: 'good',
    description: 'Red Nike road running shoes with a breathable mesh upper, flexible sole, and cushioned heel designed for regular training. They have been used outdoors but remain comfortable, supportive, and ready for a new runner.',
    estimatedValue: 3000, image: EXISTING_PUBLIC_IMAGES[4], location: { city: 'Delhi', state: 'Delhi', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[5], owner: USER_IDS.aarav, title: '[DEV-06] Louis Philippe Formal Blazer', category: 'formalwear', brand: 'Louis Philippe', size: 'M', condition: 'like-new',
    description: 'Navy Louis Philippe formal blazer with a clean notch lapel, smooth lining, and lightly tailored silhouette. It was worn for two office events, carefully dry cleaned, and is suitable for interviews, weddings, and presentations.',
    estimatedValue: 4200, image: EXISTING_PUBLIC_IMAGES[5], location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[6], owner: USER_IDS.ananya, title: '[DEV-07] Mango Floral Summer Midi Dress', category: 'dresses', brand: 'Mango', size: 'S', condition: 'new',
    description: 'Mango summer midi dress with a soft floral print, wrap-inspired waist, short sleeves, and an easy flowing skirt. The lightweight fabric suits warm Indian weather, vacations, brunches, daytime celebrations, and relaxed weekend styling.',
    estimatedValue: 2500, image: EXISTING_PUBLIC_IMAGES[6], location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }, status: 'swapped',
  },
  {
    _id: LISTING_IDS[7], owner: USER_IDS.meera, title: '[DEV-08] FabIndia Handloom Silk Saree', category: 'other', brand: 'FabIndia', size: 'One Size', condition: 'like-new',
    description: 'FabIndia handloom silk saree in deep teal with a subtle woven border and matching unstitched blouse piece. It was folded and stored carefully, making this elegant Indian textile suitable for festivals, receptions, and family celebrations.',
    estimatedValue: 3800, image: EXISTING_PUBLIC_IMAGES[7], location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }, status: 'pending',
  },
  {
    _id: LISTING_IDS[8], owner: USER_IDS.kabir, title: '[DEV-09] Wildcraft Travel Cargo Trousers', category: 'bottoms', brand: 'Wildcraft', size: 'L', condition: 'good',
    description: 'Durable Wildcraft cargo trousers in charcoal grey with useful utility pockets, articulated knees, and a comfortable travel fit. They have handled several weekend trips, remain structurally sound, and are ideal for trekking or commuting.',
    estimatedValue: 1800, image: EXISTING_PUBLIC_IMAGES[8], location: { city: 'Pune', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[9], owner: USER_IDS.meera, title: '[DEV-10] Adidas Essential Pullover Hoodie', category: 'outerwear', brand: 'Adidas', size: 'M', condition: 'good',
    description: 'Warm Adidas pullover hoodie in muted olive green with a practical front pocket and soft brushed interior. The fabric has mild signs of use, no major damage, and works well for travel, evenings, and casual layering.',
    estimatedValue: 1700, image: EXISTING_PUBLIC_IMAGES[9], location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[10], owner: USER_IDS.aarav, title: '[DEV-11] Allen Solly Stretch Chinos', category: 'bottoms', brand: 'Allen Solly', size: 'M', condition: 'like-new',
    description: 'Allen Solly stretch chinos in versatile stone beige with a neat tapered leg and comfortable cotton blend. They were worn only occasionally, retain their shape, and suit office-casual dressing, dinners, and weekend plans.',
    estimatedValue: 1600, image: EXISTING_PUBLIC_IMAGES[10], location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[11], owner: USER_IDS.ananya, title: '[DEV-12] Vero Moda Cotton Wrap Dress', category: 'dresses', brand: 'Vero Moda', size: 'M', condition: 'like-new',
    description: 'Vero Moda cotton wrap dress with a small botanical print, adjustable waist tie, and flattering midi length. The breathable fabric is comfortable in warm weather and suitable for lunches, holidays, informal gatherings, or office Fridays.',
    estimatedValue: 2100, image: EXISTING_PUBLIC_IMAGES[11], location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[12], owner: USER_IDS.kabir, title: '[DEV-13] Raymond White Formal Shirt', category: 'formalwear', brand: 'Raymond', size: 'L', condition: 'like-new',
    description: 'Crisp Raymond white formal shirt with a structured collar, breathable cotton weave, and clean long sleeves. It was worn for a handful of meetings, professionally pressed, and is ready for office wardrobes or formal occasions.',
    estimatedValue: 1900, image: EXISTING_PUBLIC_IMAGES[12], location: { city: 'Pune', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[13], owner: USER_IDS.rohan, title: '[DEV-14] Puma Flex Running Sneakers', category: 'footwear', brand: 'Puma', size: 'L', condition: 'like-new',
    description: 'Puma running sneakers with a flexible rubber sole, lightweight mesh upper, and supportive padded collar. They were used for indoor training and occasional walks, cleaned after use, and remain comfortable for everyday activity.',
    estimatedValue: 2400, image: EXISTING_PUBLIC_IMAGES[13], location: { city: 'Delhi', state: 'Delhi', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[14], owner: USER_IDS.meera, title: '[DEV-15] Ray-Ban Classic Wayfarer Sunglasses', category: 'accessories', brand: 'Ray-Ban', size: 'One Size', condition: 'good',
    description: 'Classic black Ray-Ban Wayfarer sunglasses with dark lenses, sturdy acetate frames, and the recognizable timeless shape. They show light surface wear, include a protective case, and remain a versatile accessory for sunny commutes.',
    estimatedValue: 4500, image: EXISTING_PUBLIC_IMAGES[14], location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[15], owner: USER_IDS.aarav, title: '[DEV-16] Decathlon Performance Track Jacket', category: 'activewear', brand: 'Decathlon', size: 'XL', condition: 'good',
    description: 'Decathlon performance track jacket in navy blue with a full zip, lightweight wind-resistant fabric, and practical side pockets. It has been used for morning walks and travel, with normal wear but no functional damage.',
    estimatedValue: 1300, image: EXISTING_PUBLIC_IMAGES[15], location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[16], owner: USER_IDS.kabir, title: '[DEV-17] FabAlley Festive Anarkali Dress', category: 'formalwear', brand: 'FabAlley', size: 'M', condition: 'new',
    description: 'FabAlley festive Anarkali dress in jewel-toned blue with a flowing hem, modest neckline, and subtle decorative detailing. It is unworn with careful storage and suits festive dinners, family functions, and celebratory evenings.',
    estimatedValue: 2800, image: EXISTING_PUBLIC_IMAGES[6], location: { city: 'Pune', state: 'Maharashtra', country: 'India' }, status: 'available',
  },
  {
    _id: LISTING_IDS[17], owner: USER_IDS.ananya, title: '[DEV-18] H&M Relaxed Cotton Crew Sweatshirt', category: 'tops', brand: 'H&M', size: 'L', condition: 'fair',
    description: 'Relaxed H&M cotton crew sweatshirt in warm pumpkin orange with ribbed cuffs and a soft interior. It has visible gentle fading from regular use, remains comfortable, and is useful for casual layering or creative upcycling.',
    estimatedValue: 800, image: EXISTING_PUBLIC_IMAGES[3], location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }, status: 'available',
  },
];

const DEV_SWAPS = [
  {
    _id: SWAP_IDS.completed,
    requester: USER_IDS.aarav,
    requestedListing: LISTING_IDS[6],
    offeredListing: LISTING_IDS[0],
    status: 'completed',
  },
  {
    _id: SWAP_IDS.accepted,
    requester: USER_IDS.meera,
    requestedListing: LISTING_IDS[1],
    offeredListing: LISTING_IDS[7],
    status: 'accepted',
  },
];

const DEV_CONVERSATION = {
  _id: CONVERSATION_ID,
  participants: [USER_IDS.aarav, USER_IDS.ananya].sort(),
  relatedSwapRequest: SWAP_IDS.completed,
  lastMessageAt: new Date('2026-01-15T10:05:00.000Z'),
};

const DEV_MESSAGES = [
  {
    _id: MESSAGE_IDS[0],
    conversation: CONVERSATION_ID,
    sender: USER_IDS.aarav,
    text: 'Hi Ananya, I liked the floral dress and thought my Nike training tee could be a useful exchange. Would you like to compare condition and fit details?',
    readBy: [USER_IDS.aarav, USER_IDS.ananya],
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
  },
  {
    _id: MESSAGE_IDS[1],
    conversation: CONVERSATION_ID,
    sender: USER_IDS.ananya,
    text: 'Hi Aarav, the condition sounds good and the estimated values are close. I have shared the measurements; happy to complete the exchange after confirming delivery details.',
    readBy: [USER_IDS.aarav, USER_IDS.ananya],
    createdAt: new Date('2026-01-15T10:05:00.000Z'),
  },
];

const sameId = (left, right) => left && right && left.toString() === right.toString();

function seedError(message) {
  const error = new Error(message);
  error.isSeedError = true;
  return error;
}

async function connectAndVerifyDatabase() {
  if (!process.env.MONGO_URI) {
    throw seedError('MONGO_URI is required for the development seed.');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  } catch {
    // Do not surface a driver error because it may contain connection details.
    throw seedError('MongoDB connection failed. The development seed was aborted.');
  }

  const connectedDatabaseName = mongoose.connection.name;
  if (typeof connectedDatabaseName !== 'string' || !connectedDatabaseName) {
    throw seedError('The connected database name could not be determined safely. The development seed was aborted.');
  }

  if (mongoose.connection.name !== 'rewear-dev') {
    throw seedError('This seed script only permits the rewear-dev database.');
  }

  console.log(`Connected database: ${connectedDatabaseName}`);
}

async function assertNoIdentityCollisions() {
  for (const user of DEV_USERS) {
    const byId = await User.findById(user._id).select('_id email');
    if (byId && byId.email !== user.email) {
      throw seedError('A deterministic development user ID is already used by another record. The seed was aborted.');
    }

    const byEmail = await User.findOne({ email: user.email }).select('_id email');
    if (byEmail && !sameId(byEmail._id, user._id)) {
      throw seedError('A deterministic development email is already used by another record. The seed was aborted.');
    }
  }

  for (const listing of DEV_LISTINGS) {
    const byId = await Listing.findById(listing._id).select('_id owner title');
    if (byId && (!sameId(byId.owner, listing.owner) || byId.title !== listing.title)) {
      throw seedError('A deterministic development listing ID is already used by another record. The seed was aborted.');
    }

    const byIdentity = await Listing.findOne({ owner: listing.owner, title: listing.title }).select('_id');
    if (byIdentity && !sameId(byIdentity._id, listing._id)) {
      throw seedError('A deterministic development listing identity is already used by another record. The seed was aborted.');
    }
  }

  // Never overwrite a non-seed swap that points at a development listing.
  // This also prevents a later rerun from silently making another user's
  // local swap inconsistent.
  const seedListingIds = DEV_LISTINGS.map((listing) => listing._id);
  const nonSeedSwap = await SwapRequest.exists({
    _id: { $nin: Object.values(SWAP_IDS) },
    $or: [{ requestedListing: { $in: seedListingIds } }, { offeredListing: { $in: seedListingIds } }],
  });
  if (nonSeedSwap) {
    throw seedError('A non-seed swap references development listings. The seed was aborted to preserve local data.');
  }

  for (const swap of DEV_SWAPS) {
    const existing = await SwapRequest.findById(swap._id).select('requester requestedListing offeredListing');
    if (
      existing &&
      (!sameId(existing.requester, swap.requester) ||
        !sameId(existing.requestedListing, swap.requestedListing) ||
        !sameId(existing.offeredListing, swap.offeredListing))
    ) {
      throw seedError('A deterministic development swap ID is already used by another record. The seed was aborted.');
    }
  }

  const existingConversation = await Conversation.findById(CONVERSATION_ID).select('participants relatedSwapRequest');
  if (
    existingConversation &&
    (existingConversation.participants.length !== DEV_CONVERSATION.participants.length ||
      !existingConversation.participants.every((participant, index) => sameId(participant, DEV_CONVERSATION.participants[index])) ||
      !sameId(existingConversation.relatedSwapRequest, DEV_CONVERSATION.relatedSwapRequest))
  ) {
    throw seedError('A deterministic development conversation ID is already used by another record. The seed was aborted.');
  }

  for (const message of DEV_MESSAGES) {
    const existing = await Message.findById(message._id).select('conversation sender');
    if (existing && (!sameId(existing.conversation, message.conversation) || !sameId(existing.sender, message.sender))) {
      throw seedError('A deterministic development message ID is already used by another record. The seed was aborted.');
    }
  }
}

async function validateSeedPayload(passwordHash) {
  for (const user of DEV_USERS) {
    await new User({ ...user, passwordHash }).validate();
  }

  for (const listing of DEV_LISTINGS) {
    await new Listing({ ...listing, images: [listing.image] }).validate();
  }

  for (const swap of DEV_SWAPS) {
    await new SwapRequest(swap).validate();
  }

  await new Conversation(DEV_CONVERSATION).validate();
  for (const message of DEV_MESSAGES) {
    await new Message(message).validate();
  }
}

async function upsertUser(user, passwordHash) {
  let document = await User.findById(user._id).select('+passwordHash');
  let created = false;

  if (!document) {
    document = await User.findOne({ email: user.email }).select('+passwordHash');
  }

  if (!document) {
    document = new User({ ...user, passwordHash });
    created = true;
  } else {
    Object.assign(document, user);
    // Preserve a locally changed password on an existing seed account. If a
    // legacy/incomplete seed account has no hash, repair it using bcrypt.
    if (!document.passwordHash) document.passwordHash = passwordHash;
  }

  await document.save();
  return { document, created };
}

async function upsertModelDocument(Model, data) {
  let document = await Model.findById(data._id);
  const created = !document;

  if (!document) {
    document = new Model(data);
  } else {
    Object.assign(document, data);
  }

  await document.save();
  return { document, created };
}

async function countSeedRecords() {
  const listingIds = DEV_LISTINGS.map((listing) => listing._id);
  const userIds = DEV_USERS.map((user) => user._id);
  const swapIds = DEV_SWAPS.map((swap) => swap._id);

  return {
    users: await User.countDocuments({ _id: { $in: userIds } }),
    listings: await Listing.countDocuments({ _id: { $in: listingIds } }),
    swaps: await SwapRequest.countDocuments({ _id: { $in: swapIds } }),
    conversations: await Conversation.countDocuments({ _id: CONVERSATION_ID }),
    messages: await Message.countDocuments({ _id: { $in: MESSAGE_IDS } }),
  };
}

async function seedDevelopmentData() {
  await connectAndVerifyDatabase();

  // This is deliberately after the actual database-name check. No database
  // query or mutation is allowed before that check succeeds.
  await assertNoIdentityCollisions();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, await bcrypt.genSalt(10));
  await validateSeedPayload(passwordHash);

  const summary = {
    usersCreated: 0,
    usersManaged: 0,
    listingsCreated: 0,
    listingsManaged: 0,
    swapsCreated: 0,
    swapsManaged: 0,
    conversationsCreated: 0,
    conversationsManaged: 0,
    messagesCreated: 0,
    messagesManaged: 0,
  };

  for (const user of DEV_USERS) {
    const result = await upsertUser(user, passwordHash);
    summary.usersCreated += result.created ? 1 : 0;
    summary.usersManaged += 1;
  }

  for (const listing of DEV_LISTINGS) {
    const result = await upsertModelDocument(Listing, {
      _id: listing._id,
      owner: listing.owner,
      title: listing.title,
      category: listing.category,
      brand: listing.brand,
      size: listing.size,
      condition: listing.condition,
      description: listing.description,
      images: [listing.image],
      estimatedValue: listing.estimatedValue,
      location: listing.location,
      status: listing.status,
    });
    summary.listingsCreated += result.created ? 1 : 0;
    summary.listingsManaged += 1;
  }

  for (const swap of DEV_SWAPS) {
    const result = await upsertModelDocument(SwapRequest, swap);
    summary.swapsCreated += result.created ? 1 : 0;
    summary.swapsManaged += 1;
  }

  const conversationResult = await upsertModelDocument(Conversation, DEV_CONVERSATION);
  summary.conversationsCreated += conversationResult.created ? 1 : 0;
  summary.conversationsManaged += 1;

  for (const message of DEV_MESSAGES) {
    const result = await upsertModelDocument(Message, message);
    summary.messagesCreated += result.created ? 1 : 0;
    summary.messagesManaged += 1;
  }

  const counts = await countSeedRecords();
  console.log('Development seed completed successfully.');
  console.log(`Users: ${counts.users} managed (${summary.usersCreated} created this run)`);
  console.log(`Listings: ${counts.listings} managed (${summary.listingsCreated} created this run)`);
  console.log(`Swaps: ${counts.swaps} managed (${summary.swapsCreated} created this run)`);
  console.log(`Conversations: ${counts.conversations} managed (${summary.conversationsCreated} created this run)`);
  console.log(`Messages: ${counts.messages} managed (${summary.messagesCreated} created this run)`);
  console.log('No records outside the deterministic development seed boundary were modified or deleted.');
}

(async () => {
  try {
    await seedDevelopmentData();
  } catch (error) {
    // Keep failures concise and never print connection strings, passwords,
    // driver diagnostics, or document contents.
    console.error(error.isSeedError ? error.message : 'Development seed failed. No credentials or connection details were logged.');
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
})();
