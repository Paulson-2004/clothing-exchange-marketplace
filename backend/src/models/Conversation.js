const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Always stored sorted by ID string (see chatController.js) so an
    // exact-array match query can reliably detect an existing
    // conversation between the same two people without extra logic.
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: 'A conversation must have exactly two participants',
      },
      required: true,
    },
    // Optional: lets users start chatting before a formal swap request
    // exists, per the original requirement.
    relatedSwapRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SwapRequest',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Supports "find my conversations" (GET /api/chat/conversations) and
// the duplicate-conversation lookup in createOrFindConversation.
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, relatedSwapRequest: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
