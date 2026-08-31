const mongoose = require('mongoose');

const MAX_MESSAGE_LENGTH = 2000;

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`],
    },
    // The sender is considered to have "read" their own message
    // immediately (see chatController.js), so unread counts are only
    // ever computed from the other participant's perspective.
    readBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

// Supports fetching a conversation's messages in chronological order
// (the most common and performance-sensitive query in this feature).
messageSchema.index({ conversation: 1, createdAt: 1 });

messageSchema.statics.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH;

module.exports = mongoose.model('Message', messageSchema);
