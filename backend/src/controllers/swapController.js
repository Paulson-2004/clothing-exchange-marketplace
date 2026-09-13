const mongoose = require('mongoose');
const SwapRequest = require('../models/SwapRequest');
const Listing = require('../models/Listing');
const asyncHandler = require('../utils/asyncHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared populate shape so every endpoint returns enough listing/owner
// info for the frontend without exposing sensitive user fields
// (no passwordHash, no email on the offered/requested listing owners
// beyond what's already public on a listing detail page).
const populateSwapRequest = (query) =>
  query
    .populate('requester', 'name')
    .populate({
      path: 'requestedListing',
      select: 'title images estimatedValue status owner',
      populate: { path: 'owner', select: 'name' },
    })
    .populate({
      path: 'offeredListing',
      select: 'title images estimatedValue status owner',
      populate: { path: 'owner', select: 'name' },
    });

// POST /api/swaps
// Protected. Creates a swap request: the logged-in user proposes
// trading one of their own available listings for someone else's.
const createSwapRequest = asyncHandler(async (req, res) => {
  const { requestedListingId, offeredListingId } = req.body;

  if (!requestedListingId || !offeredListingId) {
    res.status(400);
    throw new Error('Both requestedListingId and offeredListingId are required');
  }
  if (!isValidObjectId(requestedListingId) || !isValidObjectId(offeredListingId)) {
    res.status(400);
    throw new Error('Invalid listing ID');
  }
  if (requestedListingId === offeredListingId) {
    res.status(400);
    throw new Error('You cannot offer the same listing you are requesting');
  }

  const [requestedListing, offeredListing] = await Promise.all([
    Listing.findById(requestedListingId),
    Listing.findById(offeredListingId),
  ]);

  if (!requestedListing) {
    res.status(404);
    throw new Error('Requested listing not found');
  }
  if (!offeredListing) {
    res.status(404);
    throw new Error('Offered listing not found');
  }

  if (requestedListing.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot request your own listing');
  }
  if (offeredListing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only offer a listing that belongs to you');
  }

  if (requestedListing.status !== 'available') {
    res.status(400);
    throw new Error('The requested listing is not currently available');
  }
  if (offeredListing.status !== 'available') {
    res.status(400);
    throw new Error('Your offered listing is not currently available');
  }

  // Block a duplicate request for the exact same exchange (same
  // requester, same pair of listings) while one is already active.
  const existing = await SwapRequest.findOne({
    requester: req.user._id,
    requestedListing: requestedListingId,
    offeredListing: offeredListingId,
    status: { $in: SwapRequest.ACTIVE_STATUSES },
  });
  if (existing) {
    res.status(409);
    throw new Error('You already have an active swap request for this exchange');
  }

  const swapRequest = await SwapRequest.create({
    requester: req.user._id,
    requestedListing: requestedListingId,
    offeredListing: offeredListingId,
  });

  const populated = await populateSwapRequest(SwapRequest.findById(swapRequest._id));

  res.status(201).json({ success: true, swapRequest: populated });
});

// GET /api/swaps/incoming
// Protected. Requests where the logged-in user owns the requested item.
const getIncomingRequests = asyncHandler(async (req, res) => {
  const myListingIds = await Listing.find({ owner: req.user._id }).distinct('_id');

  const requests = await populateSwapRequest(
    SwapRequest.find({ requestedListing: { $in: myListingIds } }).sort({ createdAt: -1 })
  );

  res.status(200).json({ success: true, count: requests.length, swapRequests: requests });
});

// GET /api/swaps/sent
// Protected. Requests created by the logged-in user.
const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await populateSwapRequest(
    SwapRequest.find({ requester: req.user._id }).sort({ createdAt: -1 })
  );

  res.status(200).json({ success: true, count: requests.length, swapRequests: requests });
});

// PATCH /api/swaps/:id/accept
// Protected. Only the requestedListing's owner can accept a pending request.
const acceptSwapRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid swap request ID');
  }

  const swapRequest = await SwapRequest.findById(id);
  if (!swapRequest) {
    res.status(404);
    throw new Error('Swap request not found');
  }
  if (swapRequest.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be accepted');
  }

  const [requestedListing, offeredListing] = await Promise.all([
    Listing.findById(swapRequest.requestedListing),
    Listing.findById(swapRequest.offeredListing),
  ]);

  if (!requestedListing || !offeredListing) {
    res.status(404);
    throw new Error('One of the listings in this request no longer exists');
  }
  if (requestedListing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to accept this request');
  }
  // Defensive re-check in case either listing's status changed since the
  // request was created (e.g. accepted elsewhere in the meantime).
  if (requestedListing.status !== 'available' || offeredListing.status !== 'available') {
    res.status(409);
    throw new Error('One of the listings is no longer available');
  }

  swapRequest.status = 'accepted';
  requestedListing.status = 'pending';
  offeredListing.status = 'pending';

  await Promise.all([swapRequest.save(), requestedListing.save(), offeredListing.save()]);

  // Any other still-pending request touching either listing can no
  // longer be fulfilled, since both listings just became unavailable.
  await SwapRequest.updateMany(
    {
      _id: { $ne: swapRequest._id },
      status: 'pending',
      $or: [
        { requestedListing: requestedListing._id },
        { offeredListing: requestedListing._id },
        { requestedListing: offeredListing._id },
        { offeredListing: offeredListing._id },
      ],
    },
    { $set: { status: 'rejected' } }
  );

  const populated = await populateSwapRequest(SwapRequest.findById(swapRequest._id));
  res.status(200).json({ success: true, swapRequest: populated });
});

// PATCH /api/swaps/:id/reject
// Protected. Only the requestedListing's owner can reject a pending request.
const rejectSwapRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid swap request ID');
  }

  const swapRequest = await SwapRequest.findById(id);
  if (!swapRequest) {
    res.status(404);
    throw new Error('Swap request not found');
  }
  if (swapRequest.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be rejected');
  }

  const requestedListing = await Listing.findById(swapRequest.requestedListing);
  if (!requestedListing) {
    res.status(404);
    throw new Error('The requested listing no longer exists');
  }
  if (requestedListing.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to reject this request');
  }

  swapRequest.status = 'rejected';
  await swapRequest.save();

  const populated = await populateSwapRequest(SwapRequest.findById(swapRequest._id));
  res.status(200).json({ success: true, swapRequest: populated });
});

// PATCH /api/swaps/:id/cancel
// Protected. Only the original requester can cancel their own pending request.
const cancelSwapRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid swap request ID');
  }

  const swapRequest = await SwapRequest.findById(id);
  if (!swapRequest) {
    res.status(404);
    throw new Error('Swap request not found');
  }
  if (swapRequest.requester.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to cancel this request');
  }
  if (swapRequest.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be cancelled');
  }

  swapRequest.status = 'cancelled';
  await swapRequest.save();

  const populated = await populateSwapRequest(SwapRequest.findById(swapRequest._id));
  res.status(200).json({ success: true, swapRequest: populated });
});

// PATCH /api/swaps/:id/complete
// Protected. Either the requester or the requestedListing's owner can
// mark an accepted swap as completed.
const completeSwapRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid swap request ID');
  }

  const swapRequest = await SwapRequest.findById(id);
  if (!swapRequest) {
    res.status(404);
    throw new Error('Swap request not found');
  }
  if (swapRequest.status !== 'accepted') {
    res.status(400);
    throw new Error('Only accepted swaps can be completed');
  }

  const [requestedListing, offeredListing] = await Promise.all([
    Listing.findById(swapRequest.requestedListing),
    Listing.findById(swapRequest.offeredListing),
  ]);

  if (!requestedListing || !offeredListing) {
    res.status(404);
    throw new Error('One of the listings in this request no longer exists');
  }

  const userId = req.user._id.toString();
  const isRequester = swapRequest.requester.toString() === userId;
  const isRequestedOwner = requestedListing.owner.toString() === userId;
  if (!isRequester && !isRequestedOwner) {
    res.status(403);
    throw new Error('You are not authorized to complete this swap');
  }

  swapRequest.status = 'completed';
  requestedListing.status = 'swapped';
  offeredListing.status = 'swapped';

  await Promise.all([swapRequest.save(), requestedListing.save(), offeredListing.save()]);

  const populated = await populateSwapRequest(SwapRequest.findById(swapRequest._id));
  res.status(200).json({ success: true, swapRequest: populated });
});

module.exports = {
  createSwapRequest,
  getIncomingRequests,
  getSentRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
  completeSwapRequest,
};
