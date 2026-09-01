const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const asyncHandler = require('../utils/asyncHandler');
const { estimateValue } = require('../utils/valueEstimator');
const { compareValues, CLASSIFICATIONS } = require('../utils/valueComparator');
const { uploadBufferToCloudinary } = require('../middleware/upload');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Fields the client is allowed to set directly. Anything else in
// req.body (e.g. owner, status) is ignored here and handled explicitly
// where appropriate, so a request can't smuggle in an owner override.
const pickListingFields = (body) => ({
  title: body.title,
  category: body.category,
  brand: body.brand,
  size: body.size,
  condition: body.condition,
  description: body.description,
  estimatedValue: body.estimatedValue,
  location: {
    city: body.city || body.location?.city || '',
    state: body.state || body.location?.state || '',
    country: body.country || body.location?.country || '',
  },
});

// POST /api/listings
// Protected. Creates a listing owned by the logged-in user.
const createListing = asyncHandler(async (req, res) => {
  const fields = pickListingFields(req.body);

  if (!fields.title || !fields.category || !fields.brand || !fields.size || !fields.condition || !fields.description) {
    res.status(400);
    throw new Error('Title, category, brand, size, condition, and description are all required');
  }

  // req.files is populated by multer (memoryStorage), each with an
  // in-memory `buffer` rather than a disk path. Each buffer is streamed
  // to Cloudinary individually; Promise.all runs the uploads concurrently.
  const images = await Promise.all(
    (req.files || []).map((file) => uploadBufferToCloudinary(file.buffer))
  );
  if (images.length === 0) {
    res.status(400);
    throw new Error('At least one image is required');
  }

  let estimatedValue = Number(fields.estimatedValue);
  if (Number.isNaN(estimatedValue) || estimatedValue < 0) {
    // Fall back to the estimator if the client didn't send a usable
    // number, rather than rejecting the request outright.
    estimatedValue = estimateValue({ category: fields.category, brand: fields.brand, condition: fields.condition });
  }

  const listing = await Listing.create({
    owner: req.user._id,
    title: fields.title,
    category: fields.category,
    brand: fields.brand,
    size: fields.size,
    condition: fields.condition,
    description: fields.description,
    images,
    estimatedValue,
    location: fields.location,
  });

  const populated = await listing.populate('owner', 'name email location');

  res.status(201).json({ success: true, listing: populated });
});

// GET /api/listings
// Public. Supports search + filtering via query params:
//   search, category, size, condition, city, state, status
// Defaults to only 'available' listings unless a status is explicitly requested.
const getListings = asyncHandler(async (req, res) => {
  const { search, category, size, condition, city, state, status } = req.query;

  const query = {};

  if (search) {
    query.$text = { $search: search };
  }
  if (category) query.category = category;
  if (size) query.size = size;
  if (condition) query.condition = condition;
  if (city) query['location.city'] = new RegExp(`^${city}$`, 'i');
  if (state) query['location.state'] = new RegExp(`^${state}$`, 'i');
  query.status = status || 'available';

  const listings = await Listing.find(query)
    .populate('owner', 'name email location')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: listings.length, listings });
});

// GET /api/listings/:id
// Public. Returns a single listing.
const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid listing ID');
  }

  const listing = await Listing.findById(id).populate('owner', 'name email location');

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.status(200).json({ success: true, listing });
});

// PUT /api/listings/:id
// Protected. Only the owner can update their own listing.
const updateListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid listing ID');
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Ownership is enforced here on the backend - never trust a frontend
  // check alone for this.
  if (listing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this listing');
  }

  const fields = pickListingFields(req.body);

  // Only overwrite fields that were actually provided, so a partial
  // update doesn't blank out the rest of the listing.
  if (fields.title) listing.title = fields.title;
  if (fields.category) listing.category = fields.category;
  if (fields.brand) listing.brand = fields.brand;
  if (fields.size) listing.size = fields.size;
  if (fields.condition) listing.condition = fields.condition;
  if (fields.description) listing.description = fields.description;
  if (fields.location.city) listing.location.city = fields.location.city;
  if (fields.location.state) listing.location.state = fields.location.state;
  if (fields.location.country) listing.location.country = fields.location.country;

  if (req.body.estimatedValue !== undefined) {
    const estimatedValue = Number(req.body.estimatedValue);
    if (Number.isNaN(estimatedValue) || estimatedValue < 0) {
      res.status(400);
      throw new Error('Estimated value must be a valid non-negative number');
    }
    listing.estimatedValue = estimatedValue;
  }

  if (req.body.status) {
    const { STATUSES } = Listing;
    if (!STATUSES.includes(req.body.status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }
    listing.status = req.body.status;
  }

  // New images (if any were uploaded) are appended to the existing set
  // rather than replacing it, so editing text fields doesn't wipe photos.
  const newImages = await Promise.all(
    (req.files || []).map((file) => uploadBufferToCloudinary(file.buffer))
  );
  if (newImages.length > 0) {
    listing.images = [...listing.images, ...newImages];
  }

  const updated = await listing.save();
  const populated = await updated.populate('owner', 'name email location');

  res.status(200).json({ success: true, listing: populated });
});

// DELETE /api/listings/:id
// Protected. Only the owner can delete their own listing.
const deleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid listing ID');
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to delete this listing');
  }

  await listing.deleteOne();

  res.status(200).json({ success: true, message: 'Listing deleted successfully' });
});

// GET /api/listings/mine/all
// Protected. Returns all listings owned by the logged-in user
// regardless of status (used by the "My Listings" page).
const getMyListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: listings.length, listings });
});

// GET /api/listings/compare?listingA=<id>&listingB=<id>
// Public. Read-only. Compares the estimated values of two listings and
// returns a structured comparison result (absolute difference, percentage
// difference, fairness classification). Does NOT modify any documents.
// The comparison is informational only — it has no authority over swap
// status, acceptance, or rejection.
const compareListings = asyncHandler(async (req, res) => {
  const { listingA: idA, listingB: idB } = req.query;

  if (!idA || !idB) {
    res.status(400);
    throw new Error('Both listingA and listingB query parameters are required');
  }
  if (!isValidObjectId(idA) || !isValidObjectId(idB)) {
    res.status(400);
    throw new Error('One or both listing IDs are not valid MongoDB ObjectIds');
  }
  if (idA === idB) {
    res.status(400);
    throw new Error('listingA and listingB must be different listings');
  }

  const [listingA, listingB] = await Promise.all([
    Listing.findById(idA).select('title estimatedValue status'),
    Listing.findById(idB).select('title estimatedValue status'),
  ]);

  if (!listingA) {
    res.status(404);
    throw new Error('listingA not found');
  }
  if (!listingB) {
    res.status(404);
    throw new Error('listingB not found');
  }

  const comparison = compareValues(listingA.estimatedValue, listingB.estimatedValue);

  res.status(200).json({
    success: true,
    listingA: {
      _id: listingA._id,
      title: listingA.title,
      estimatedValue: listingA.estimatedValue,
      status: listingA.status,
    },
    listingB: {
      _id: listingB._id,
      title: listingB.title,
      estimatedValue: listingB.estimatedValue,
      status: listingB.status,
    },
    comparison,
  });
});

// GET /api/listings/:id/matches
// Public. Read-only. Returns listings that are potential swap partners
// for the given listing, based on location proximity and estimated-value
// compatibility. Does NOT modify any documents.
//
// Location matching uses hierarchical string comparison on city/state:
//   - "exact": same city AND same state (case-insensitive) — score 3
//   - "state": same state, different/missing city               — score 2
//
// Value compatibility reuses Phase 6's compareValues():
//   - "Close Match"       (≤20% difference) — included, score 3
//   - "Moderate Difference" (≤50%)          — included, score 1
//   - "Large Difference"   (>50%)           — excluded
//
// matchScore = locationScore + valueScore
// Sorted by: score DESC, absoluteDifference ASC, createdAt DESC
//
// Filters: only 'available' listings, excludes source listing and
// listings owned by the same user.
const getListingMatches = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid listing ID');
  }

  const sourceListing = await Listing.findById(id)
    .select('title estimatedValue location status owner')
    .populate('owner', 'name');

  if (!sourceListing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const sourceState = (sourceListing.location?.state || '').trim().toLowerCase();

  // If the source listing has no state, we have no location basis for matching.
  if (!sourceState) {
    return res.status(200).json({
      success: true,
      sourceListing: {
        _id: sourceListing._id,
        title: sourceListing.title,
        estimatedValue: sourceListing.estimatedValue,
        location: sourceListing.location,
        status: sourceListing.status,
      },
      matches: [],
      count: 0,
      message: 'Source listing has no state/region — location-based matching requires at least a state.',
    });
  }

  // Parse optional limit (default 20, max 50).
  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const sourceCity = (sourceListing.location?.city || '').trim().toLowerCase();

  // Find all available listings in the same state (case-insensitive),
  // excluding the source listing itself and the source listing's owner.
  const candidates = await Listing.find({
    _id: { $ne: sourceListing._id },
    owner: { $ne: sourceListing.owner._id || sourceListing.owner },
    status: 'available',
    'location.state': new RegExp(`^${sourceState.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  })
    .populate('owner', 'name email location')
    .lean();

  // Score, filter, and rank candidates.
  const scored = [];

  for (const candidate of candidates) {
    const candState = (candidate.location?.state || '').trim().toLowerCase();
    const candCity = (candidate.location?.city || '').trim().toLowerCase();

    // Determine location tier.
    // We already filtered to same-state in the DB query, but double-check
    // and determine exact vs state tier.
    if (candState !== sourceState) continue; // safety guard

    let locationTier, locationLabel, locationScore;
    if (sourceCity && candCity && candCity === sourceCity) {
      locationTier = 'exact';
      locationLabel = 'Same city';
      locationScore = 3;
    } else {
      locationTier = 'state';
      locationLabel = 'Same state';
      locationScore = 2;
    }

    // Value compatibility via Phase 6's compareValues.
    const valueComparison = compareValues(
      sourceListing.estimatedValue,
      candidate.estimatedValue
    );

    // Exclude Large Difference.
    if (valueComparison.classification === CLASSIFICATIONS.LARGE) continue;

    const valueScore = valueComparison.classification === CLASSIFICATIONS.CLOSE ? 3 : 1;
    const score = locationScore + valueScore;

    scored.push({
      listing: candidate,
      matchDetails: {
        locationTier,
        locationLabel,
        valueComparison,
        score,
      },
    });
  }

  // Deterministic sort: score DESC → absoluteDifference ASC → createdAt DESC
  scored.sort((a, b) => {
    if (b.matchDetails.score !== a.matchDetails.score) {
      return b.matchDetails.score - a.matchDetails.score;
    }
    if (a.matchDetails.valueComparison.absoluteDifference !== b.matchDetails.valueComparison.absoluteDifference) {
      return a.matchDetails.valueComparison.absoluteDifference - b.matchDetails.valueComparison.absoluteDifference;
    }
    // createdAt DESC (newer first) — candidates are lean objects, so use
    // the raw timestamp.
    return new Date(b.listing.createdAt) - new Date(a.listing.createdAt);
  });

  // Apply limit.
  const limited = scored.slice(0, limit);

  res.status(200).json({
    success: true,
    sourceListing: {
      _id: sourceListing._id,
      title: sourceListing.title,
      estimatedValue: sourceListing.estimatedValue,
      location: sourceListing.location,
      status: sourceListing.status,
    },
    matches: limited,
    count: limited.length,
  });
});

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  compareListings,
  getListingMatches,
};

