const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const { estimateValue } = require('../utils/valueEstimator');
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  compareListings,
  getListingMatches,
} = require('../controllers/listingController');

const router = express.Router();

// GET /api/listings/mine/all - must be defined BEFORE /:id so Express
// doesn't try to interpret "mine" as an :id value.
router.get('/mine/all', protect, getMyListings);

// GET /api/listings/estimate-value?category=&brand=&condition=
// Public. Lets the frontend show a live suggested value while the
// user fills out the Create/Edit Listing form, using the exact same
// formula the backend uses when a value isn't provided at all.
router.get('/estimate-value', (req, res) => {
  const { category, brand, condition } = req.query;
  const value = estimateValue({ category, brand, condition });
  res.status(200).json({ success: true, estimatedValue: value });
});

// GET /api/listings/compare?listingA=<id>&listingB=<id>
// Public. Read-only. Returns a structured value comparison (Phase 6).
// Must be before /:id to prevent Express treating "compare" as an ID.
router.get('/compare', compareListings);

router.route('/')
  .get(getListings)
  .post(protect, upload.array('images', 5), createListing);

// GET /api/listings/:id/matches
// Public. Read-only. Returns location + value compatible matches (Phase 7).
// Must be defined before the bare /:id route.
router.get('/:id/matches', getListingMatches);

router.route('/:id')
  .get(getListingById)
  .put(protect, upload.array('images', 5), updateListing)
  .delete(protect, deleteListing);

module.exports = router;
