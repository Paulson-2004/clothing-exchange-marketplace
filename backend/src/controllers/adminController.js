// Phase 8 — Admin Panel controller.
//
// Every function in this file is intended to run behind the
// `protect` + `requireAdmin` middleware chain defined in
// authMiddleware.js. The route file (adminRoutes.js) is responsible
// for applying that chain — this controller assumes req.user is a
// verified admin.
//
// Follows the project's established patterns:
//   - asyncHandler wrapper (no try/catch in each function)
//   - res.status(xxx); throw new Error(...) for errors
//   - { success: true, ...payload } response envelope

const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const User = require('../models/User');
const Listing = require('../models/Listing');
const SwapRequest = require('../models/SwapRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { anonymizeAccount, isDeletedUser } = require('../utils/accountUtils');

// ─── Pagination helper ─────────────────────────────────────────────
// Shared across all list endpoints. Defaults to page 1, 20 per page,
// max 50 per page.

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── GET /api/admin/stats ──────────────────────────────────────────
// Dashboard aggregate statistics. Related status totals are grouped in a
// single collection pass per model rather than issuing one count query per
// status.

const getStats = asyncHandler(async (req, res) => {
  const [
    userStats,
    listingStatusCounts,
    swapStatusCounts,
    totalMessages,
  ] = await Promise.all([
    // One user collection pass replaces separate total/admin count calls.
    User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          admins: [{ $match: { role: 'admin' } }, { $count: 'count' }],
        },
      },
    ]),
    Listing.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        },
      },
    ]),
    SwapRequest.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        },
      },
    ]),
    Message.countDocuments(),
  ]);

  const userCounts = userStats[0] || {};
  const totalUsers = userCounts.total?.[0]?.count || 0;
  const adminUsers = userCounts.admins?.[0]?.count || 0;
  const listingStats = listingStatusCounts[0] || {};
  const swapStats = swapStatusCounts[0] || {};
  const listingsByStatus = Object.fromEntries(
    (listingStats.byStatus || []).map(({ _id, count }) => [_id, count])
  );
  const swapsByStatus = Object.fromEntries(
    (swapStats.byStatus || []).map(({ _id, count }) => [_id, count])
  );
  const totalListings = listingStats.total?.[0]?.count || 0;
  const totalSwaps = swapStats.total?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    stats: {
      users: { total: totalUsers, admins: adminUsers },
      listings: {
        total: totalListings,
        available: listingsByStatus.available || 0,
        pending: listingsByStatus.pending || 0,
        swapped: listingsByStatus.swapped || 0,
      },
      swaps: {
        total: totalSwaps,
        pending: swapsByStatus.pending || 0,
        accepted: swapsByStatus.accepted || 0,
        rejected: swapsByStatus.rejected || 0,
        completed: swapsByStatus.completed || 0,
        cancelled: swapsByStatus.cancelled || 0,
      },
      messages: { total: totalMessages },
    },
  });
});

// ─── GET /api/admin/users ──────────────────────────────────────────
// Paginated user list with optional search (name/email) and role filter.

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  // Role filter
  if (req.query.role && ['user', 'admin'].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  // Search by name or email (case-insensitive partial match)
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(escapeRegex(req.query.search.trim().slice(0, 100)), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const totalCount = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const users = await User.find(filter)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    users,
    page,
    totalPages,
    totalCount,
  });
});

// ─── GET /api/admin/users/:id ──────────────────────────────────────
// Single user with profile info and activity summary counts.

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }

  const user = await User.findById(id).select('-passwordHash').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Activity summary — parallel count queries
  const [listingCount, swapCount, messageCount] = await Promise.all([
    Listing.countDocuments({ owner: user._id }),
    SwapRequest.countDocuments({ requester: user._id }),
    Message.countDocuments({ sender: user._id }),
  ]);

  res.status(200).json({
    success: true,
    user,
    activity: { listingCount, swapCount, messageCount },
  });
});

// ─── PATCH /api/admin/users/:id/role ───────────────────────────────
// Toggle user role between 'user' and 'admin'. Prevents self-demotion
// to avoid accidental admin lockout.

const toggleUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }

  // Prevent self-demotion
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error('Cannot change your own role');
  }

  const user = await User.findById(id).select('-passwordHash');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent modifying an anonymized/deleted user
  if (isDeletedUser(user)) {
    res.status(400);
    throw new Error('Cannot change role of a deleted user');
  }

  // Toggle
  user.role = user.role === 'admin' ? 'user' : 'admin';
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// ─── GET /api/admin/listings ───────────────────────────────────────
// Paginated listing list across ALL statuses. Supports search, status
// filter, and category filter.

const getAdminListings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  // Status filter (allow 'any' or omit to get all statuses)
  if (req.query.status && req.query.status !== 'any') {
    if (Listing.STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
  }

  // Category filter
  if (req.query.category && Listing.CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category;
  }

  // Search by title/brand (text search)
  if (req.query.search && req.query.search.trim()) {
    filter.$text = { $search: req.query.search.trim() };
  }

  const totalCount = await Listing.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const listings = await Listing.find(filter)
    .select('title category brand status estimatedValue images owner createdAt')
    .slice('images', 1)
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    listings,
    page,
    totalPages,
    totalCount,
  });
});

// ─── DELETE /api/admin/listings/:id ────────────────────────────────
// Admin-delete a listing. Also auto-cancels/rejects any active
// (pending/accepted) swap requests referencing this listing, to
// prevent orphaned swap requests pointing at deleted listings.

const adminDeleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid listing ID format');
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const listingFilter = {
    $or: [{ requestedListing: listing._id }, { offeredListing: listing._id }],
  };

  // Capture accepted swaps before changing their status. The previous
  // implementation queried every historical rejected swap afterwards,
  // which both did unnecessary work and could restore unrelated listings.
  const acceptedSwaps = await SwapRequest.find({ ...listingFilter, status: 'accepted' })
    .select('requestedListing offeredListing')
    .lean();

  // Auto-reject active requests involving this listing. Keep the existing
  // moderation behavior and status values intact.
  await SwapRequest.updateMany(
    {
      ...listingFilter,
      status: { $in: ['pending', 'accepted'] },
    },
    { $set: { status: 'rejected' } }
  );

  // Restore only the partner listings from accepted swaps that were just
  // invalidated, in one bulk update.
  const deletedListingId = listing._id.toString();
  const partnerListingIds = [
    ...new Set(
      acceptedSwaps
        .map((swap) =>
          swap.requestedListing.toString() === deletedListingId
            ? swap.offeredListing.toString()
            : swap.requestedListing.toString()
        )
        .filter((partnerId) => partnerId !== deletedListingId)
    ),
  ];

  if (partnerListingIds.length > 0) {
    await Listing.updateMany(
      { _id: { $in: partnerListingIds }, status: 'pending' },
      { $set: { status: 'available' } }
    );
  }

  await listing.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Listing deleted by admin',
  });
});

// ─── GET /api/admin/swaps ──────────────────────────────────────────
// Paginated list of ALL swap requests across all users. Supports
// status filter.

const getAdminSwaps = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  // Status filter
  if (req.query.status && req.query.status !== 'any') {
    if (SwapRequest.STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
  }

  const totalCount = await SwapRequest.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const swaps = await SwapRequest.find(filter)
    .populate('requester', 'name email')
    .populate({
      path: 'requestedListing',
      select: 'title owner',
      populate: { path: 'owner', select: 'name' },
    })
    .populate({
      path: 'offeredListing',
      select: 'title owner',
      populate: { path: 'owner', select: 'name' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    swaps,
    page,
    totalPages,
    totalCount,
  });
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────
// Admin-delete a user.
const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }

  // Prevent self-deletion
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }

  const user = await User.findById(id).select('+passwordHash');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deleting an already-deleted/anonymized user
  if (isDeletedUser(user)) {
    res.status(400);
    throw new Error('User account is already deleted');
  }

  // Prevent deleting the last admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      res.status(400);
      throw new Error('Cannot delete the last remaining administrator');
    }
  }

  await anonymizeAccount(user);

  res.status(200).json({
    success: true,
    message: 'User account deleted by admin',
  });
});

module.exports = {
  getStats,
  getUsers,
  getUserById,
  toggleUserRole,
  adminDeleteUser,
  getAdminListings,
  adminDeleteListing,
  getAdminSwaps,
};
