const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  createOrFindConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} = require('../controllers/chatController');

const router = express.Router();

// Every chat endpoint requires authentication - there is no public
// view of any conversation or message.
router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createOrFindConversation);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.patch('/conversations/:id/read', protect, markConversationRead);

module.exports = router;
