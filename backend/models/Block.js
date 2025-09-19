const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blocker: {                    // the user who performs the block
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  blocked: {                    // the user who gets blocked
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {                     
    type: String,
    trim: true,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // we don't usually update block entries, so timestamps not required
  versionKey: false
});

// Prevent duplicate block records (one block per pair)
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Quick lookup of who blocked a user or who a user blocked
blockSchema.index({ blocked: 1 });
blockSchema.index({ blocker: 1 });

module.exports = mongoose.model('Block', blockSchema);