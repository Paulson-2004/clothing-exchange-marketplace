// accountUtils.js
// Utility functions for account lifecycle management.
//
// isDeletedUser  — called whenever the UI needs to know whether a user
//                  document belongs to a deleted account (e.g., to show
//                  "Deleted User" instead of a real name in chat).
//
// anonymizeAccount — called by authController.deleteAccount and
//                    adminController.adminDeleteUser. It performs a soft
//                    delete so that existing conversation history and
//                    completed swap records remain intact.

// Utility functions for handling user account deletion.
// We use a "soft delete" (anonymization) strategy instead of hard-deleting
// the User document. Hard-deleting a user would break existing chat threads
// and swap histories for other users who interacted with them.
const bcrypt = require('bcryptjs');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');

// Checks if an account has been soft-deleted.
// We use a specific email pattern (deleted_<timestamp>_<id>@example.com)
// as a sentinel value to identify anonymized accounts without needing
// an extra 'isDeleted' boolean column in the database.
const isDeletedUser = (user) => {
  if (!user) return false;
  const email = typeof user.email === 'string' ? user.email : '';
  // Match format: deleted_<timestamp>_<24_char_hex_id>@example.com
  return /^deleted_\d+_[a-fA-F0-9]{24}@example\.com$/.test(email);
};

// other users' Conversation and Message documents hold a reference to
// this user's _id. If the document disappeared, those references would
// resolve to null and crash any feature that tries to read the
// participant's name. Instead we:
//   Step 1 — Cancel all active swaps involving the user's listings and
//             restore any partner listings that were locked as 'pending'.
//   Step 2 — Hard-delete the user's own Listing documents (they are no
//             longer needed and would be orphaned anyway).
//   Step 3 — Anonymize (but keep) the User document so chat history
//             can still display "Deleted User" safely.
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
