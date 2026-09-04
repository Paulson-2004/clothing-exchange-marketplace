const bcrypt = require('bcryptjs');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');

const isDeletedUser = (user) => {
  if (!user) return false;
  const email = typeof user.email === 'string' ? user.email : '';
  // Match format: deleted_<timestamp>_<24_char_hex_id>@example.com
  return /^deleted_\d+_[a-fA-F0-9]{24}@example\.com$/.test(email);
};

const anonymizeAccount = async (user) => {
  // 1. Delete all available/pending listings owned by the user.
  const listings = await Listing.find({ owner: user._id, status: { $in: ['available', 'pending'] } });

  for (const listing of listings) {
    // Cancel active swap requests involving this listing
    await SwapRequest.updateMany(
      {
        $or: [{ requestedListing: listing._id }, { offeredListing: listing._id }],
        status: { $in: ['pending', 'accepted'] },
      },
      { $set: { status: 'cancelled' } }
    );

    // Restore counterparty listings to 'available' if they were pending
    const affectedSwaps = await SwapRequest.find({
      $or: [{ requestedListing: listing._id }, { offeredListing: listing._id }],
      status: 'cancelled',
    });

    for (const swap of affectedSwaps) {
      const otherListingId = swap.requestedListing.toString() === listing._id.toString()
        ? swap.offeredListing
        : swap.requestedListing;
      
      if (otherListingId && otherListingId.toString() !== listing._id.toString()) {
        await Listing.updateOne(
          { _id: otherListingId, status: 'pending' },
          { $set: { status: 'available' } }
        );
      }
    }

    await listing.deleteOne();
  }

  // 2. Cancel any pending/accepted swaps where the user is the requester
  const activeSwapsAsRequester = await SwapRequest.find({
    requester: user._id,
    status: { $in: ['pending', 'accepted'] }
  });

  for (const swap of activeSwapsAsRequester) {
    swap.status = 'cancelled';
    await swap.save();

    // Restore counterparty's requested listing if it was pending
    await Listing.updateOne(
      { _id: swap.requestedListing, status: 'pending' },
      { $set: { status: 'available' } }
    );
  }

  // 3. Anonymize the user record to preserve chat and completed swap history
  // We cannot hard-delete the user because other users' chat threads would
  // crash when trying to read properties of a null participant.
  user.name = 'Deleted User';
  user.email = `deleted_${Date.now()}_${user._id}@example.com`;
  user.passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
  user.phone = '';
  user.bio = '';
  user.location = { city: '', state: '', country: '' };
  
  await user.save();
};

module.exports = { anonymizeAccount, isDeletedUser };

