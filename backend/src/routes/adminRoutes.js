// Phase 8 — Admin routes.
//
// Every route in this file is guarded by protect + requireAdmin.
// The protect middleware verifies the JWT and loads req.user;
// requireAdmin then checks req.user.role === 'admin' (403 otherwise).

const express = require('express');
const router = express.Router();

const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getStats,
  getUsers,
  getUserById,
  toggleUserRole,
  getAdminListings,
  adminDeleteListing,
  getAdminSwaps,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, requireAdmin);

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', toggleUserRole);

// Listing moderation
router.get('/listings', getAdminListings);
router.delete('/listings/:id', adminDeleteListing);

// Swap activity monitoring
router.get('/swaps', getAdminSwaps);

module.exports = router;
