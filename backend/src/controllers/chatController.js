const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const asyncHandler = require('../utils/asyncHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const DEFAULT_MESSAGE_LIMIT = 200; // generous cap, not real pagination - see route docs

// Shared populate shape for returning a conversation with enough info
// for the frontend to render a list item or a chat header, without
// exposing sensitive user fields.
const populateConversation = (query) =>
  query.populate('participants', 'name').populate({
    path: 'relatedSwapRequest',
    select: 'status requester requestedListing offeredListing',
    populate: [
      { path: 'requestedListing', select: 'title images estimatedValue owner' },
      { path: 'offeredListing', select: 'title images estimatedValue owner' },
    ],
  });

// Shapes a raw populated conversation doc into what the frontend needs,
// including whichever participant ISN'T the current user.
const shapeConversation = (conversation, currentUserId) => {
  const other = conversation.participants.find((p) => p._id.toString() !== currentUserId.toString());
  return {
    _id: conversation._id,
    otherParticipant: other ? { _id: other._id, name: other.name } : null,
    relatedSwapRequest: conversation.relatedSwapRequest || null,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
};

// GET /api/chat/conversations
// Protected. Returns only the logged-in user's own conversations, each
// with the other participant, related swap info, latest message, and
// an unread count.
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await populateConversation(
    Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 })
  );

  const withExtras = await Promise.all(
    conversations.map(async (conversation) => {
      const [latestMessage, unreadCount] = await Promise.all([
        Message.findOne({ conversation: conversation._id }).sort({ createdAt: -1 }).select('text sender createdAt'),
        Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        }),
      ]);

      return {
        ...shapeConversation(conversation, req.user._id),
        latestMessage: latestMessage
          ? { text: latestMessage.text, sender: latestMessage.sender, createdAt: latestMessage.createdAt }
          : null,
        unreadCount,
      };
    })
  );

  res.status(200).json({ success: true, count: withExtras.length, conversations: withExtras });
});

// POST /api/chat/conversations
// Protected. Creates a new conversation, or returns an existing one for
// the same pair of participants + same related swap request (if any).
const createOrFindConversation = asyncHandler(async (req, res) => {
  const { otherUserId, swapRequestId } = req.body;

  if (!otherUserId || !isValidObjectId(otherUserId)) {
    res.status(400);
    throw new Error('A valid otherUserId is required');
  }
  if (otherUserId === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot start a conversation with yourself');
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    res.status(404);
    throw new Error('The other user could not be found');
  }

  let relatedSwapRequestId = null;
  if (swapRequestId) {
    if (!isValidObjectId(swapRequestId)) {
      res.status(400);
      throw new Error('Invalid swap request ID');
    }
    const swapRequest = await SwapRequest.findById(swapRequestId).populate('requestedListing', 'owner');
    if (!swapRequest) {
      res.status(404);
      throw new Error('Swap request not found');
    }

    const userId = req.user._id.toString();
    const isRequester = swapRequest.requester.toString() === userId;
    const isRequestedOwner = swapRequest.requestedListing?.owner?.toString() === userId;
    if (!isRequester && !isRequestedOwner) {
      res.status(403);
      throw new Error('You are not a party to this swap request');
    }

    relatedSwapRequestId = swapRequest._id;
  }

  // Store participants in a stable sorted order so an exact-array match
  // reliably finds an existing conversation regardless of who initiates.
  const participants = [req.user._id.toString(), otherUserId].sort();

  const existing = await populateConversation(
    Conversation.findOne({
      participants,
      relatedSwapRequest: relatedSwapRequestId,
    })
  );

  if (existing) {
    return res.status(200).json({
      success: true,
      conversation: shapeConversation(existing, req.user._id),
    });
  }

  const created = await Conversation.create({
    participants,
    relatedSwapRequest: relatedSwapRequestId,
  });

  const populated = await populateConversation(Conversation.findById(created._id));

  res.status(201).json({ success: true, conversation: shapeConversation(populated, req.user._id) });
});

// Loads a conversation and verifies the current user is a participant.
// Shared by the messages and read-status endpoints below. Throws (via
// res.status + Error) if not found or not authorized, matching the
// existing project convention of throwing inside asyncHandler-wrapped
// functions.
const loadConversationForParticipant = async (id, userId, res) => {
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid conversation ID');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant in this conversation');
  }

  return conversation;
};

// GET /api/chat/conversations/:id/messages
// Protected. Only participants can read a conversation's messages.
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForParticipant(req.params.id, req.user._id, res);

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .limit(DEFAULT_MESSAGE_LIMIT)
    .populate('sender', 'name');

  res.status(200).json({ success: true, count: messages.length, messages });
});

// POST /api/chat/conversations/:id/messages
// Protected. Only participants can send a message.
const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForParticipant(req.params.id, req.user._id, res);

  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Message text cannot be empty');
  }
  if (text.trim().length > Message.MAX_MESSAGE_LENGTH) {
    res.status(400);
    throw new Error(`Message cannot exceed ${Message.MAX_MESSAGE_LENGTH} characters`);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
    readBy: [req.user._id], // sender has implicitly "read" their own message
  });

  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const populated = await message.populate('sender', 'name');

  res.status(201).json({ success: true, message: populated });
});

// PATCH /api/chat/conversations/:id/read
// Protected. Marks all of the OTHER participant's messages as read for
// the current user. A user can only ever affect their own read state.
const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForParticipant(req.params.id, req.user._id, res);

  const result = await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    { $addToSet: { readBy: req.user._id } }
  );

  res.status(200).json({ success: true, markedCount: result.modifiedCount });
});

module.exports = {
  getConversations,
  createOrFindConversation,
  getMessages,
  sendMessage,
  markConversationRead,
};
