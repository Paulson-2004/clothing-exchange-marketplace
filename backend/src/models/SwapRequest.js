const mongoose = require('mongoose');

const STATUSES = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
// Statuses that still "hold" the exchange open - used to block duplicate
// requests and to find conflicting requests when one gets accepted.
const ACTIVE_STATUSES = ['pending', 'accepted'];

const swapRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    offeredListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid swap request status' },
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Supports GET /api/swaps/sent (find by requester) filtered by status,
// and the duplicate-request check in createSwapRequest.
swapRequestSchema.index({ requester: 1, status: 1 });
// Supports GET /api/swaps/incoming (find by requestedListing's owner,
// via a listing-id lookup) and conflict detection on accept.
swapRequestSchema.index({ requestedListing: 1, status: 1 });
swapRequestSchema.index({ offeredListing: 1, status: 1 });

swapRequestSchema.statics.STATUSES = STATUSES;
swapRequestSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
