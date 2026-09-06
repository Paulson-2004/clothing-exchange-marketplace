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
  // 1. Identify the user's active listings once, then cancel all related
  // swaps in bulk. This replaces one read/update/delete loop per listing and
  // avoids looking at historical cancelled swaps.
  const ownedListingIds = await Listing.find({
    owner: user._id,
    status: { $in: ['available', 'pending'] },
  }).distinct('_id');

  const activeSwaps = await SwapRequest.find({
    $or: [
      { requester: user._id },
      { requestedListing: { $in: ownedListingIds } },
      { offeredListing: { $in: ownedListingIds } },
    ],
    status: { $in: ['pending', 'accepted'] },
  })
    .select('requestedListing offeredListing')
    .lean();

  if (activeSwaps.length > 0) {
    await SwapRequest.updateMany(
      {
        _id: { $in: activeSwaps.map((swap) => swap._id) },
      },
      { $set: { status: 'cancelled' } }
    );

    const ownedIdSet = new Set(ownedListingIds.map((id) => id.toString()));
    const partnerListingIds = [
      ...new Set(
        activeSwaps
          .flatMap((swap) => [swap.requestedListing, swap.offeredListing])
          .filter((id) => id && !ownedIdSet.has(id.toString()))
          .map((id) => id.toString())
      ),
    ];

    if (partnerListingIds.length > 0) {
      await Listing.updateMany(
        { _id: { $in: partnerListingIds }, status: 'pending' },
        { $set: { status: 'available' } }
      );
    }
  }

  if (ownedListingIds.length > 0) {
    await Listing.deleteMany({ _id: { $in: ownedListingIds } });
  }

  // 2. Anonymize the user record to preserve chat and completed swap history
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
