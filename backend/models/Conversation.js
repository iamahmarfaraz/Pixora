const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // participants in the conversation (1-to-1 or group)
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],

  // optional name for group chats
  name: {
    type: String,
    default: null
  },

  // last message text (for quick preview in chat list)
  lastMessage: {
    type: String,
    default: null
  },

  // who sent the last message
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // track if it's a group chat or 1-to-1
  isGroup: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true  // auto add createdAt & updatedAt
});

// Index for quick user conversation lookup
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);