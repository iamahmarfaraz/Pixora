
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // which conversation this message belongs to
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },

  // sender of the message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // text content
  text: {
    type: String,
    default: null,
    trim: true
  },

  // attachments: image, video, file, etc.
  attachments: [
    {
      url: { type: String, required: true },   // file storage URL (S3, Cloudinary, etc.)
      type: { 
        type: String,
        enum: ['image', 'video', 'audio', 'file'],
        required: true
      }
    }
  ],

  // reply-to feature (if this message is a reply to another)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },

  // has the recipient(s) read this message?
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }

}, {
  timestamps: true  // createdAt, updatedAt
});

// Index to quickly fetch all messages in a conversation, sorted by time
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);