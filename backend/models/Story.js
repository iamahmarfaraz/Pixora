const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: { // Owner of the story
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  mediaUrl: { // Cloudinary / S3 URL
    type: String,
    required: true
  },

  caption: { // Optional text caption
    type: String,
    trim: true,
    maxlength: 500
  },

  tags: [{ // Tagged users
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  viewers: [{ // Who viewed the story
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: { // When story was created
    type: Date,
    default: Date.now
  },

  expiresAt: { // TTL auto-expiry (24h)
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000,
    index: { expires: 0 } // TTL index → remove at expiresAt
  }

}, {
  timestamps: false // we manage createdAt / expiresAt ourselves
});

module.exports = mongoose.model('Story', storySchema);