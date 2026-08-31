const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createSwapRequest,
  getIncomingRequests,
  getSentRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
  completeSwapRequest,
} = require('../controllers/swapController');

const router = express.Router();

// All swap routes require authentication - there is no public view of
// swap requests.
router.post('/', protect, createSwapRequest);
router.get('/incoming', protect, getIncomingRequests);
router.get('/sent', protect, getSentRequests);
router.patch('/:id/accept', protect, acceptSwapRequest);
router.patch('/:id/reject', protect, rejectSwapRequest);
router.patch('/:id/cancel', protect, cancelSwapRequest);
router.patch('/:id/complete', protect, completeSwapRequest);

module.exports = router;
