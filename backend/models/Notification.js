const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // recipient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // who caused this notification (optional)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // notification kind
  type: {
    type: String,
    enum: [
      'FOLLOW',
      'LIKE',
      'COMMENT',
      'MENTION',
      'REPLY',
      'LIVE_STARTED',
      'SYSTEM',
      'MESSAGE'
    ],
    required: true,
    index: true
  },

  // dynamic reference to the object that caused the notification
  refType: { 
    type: String, 
    default: null 
  },

  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null, refPath: 'refType',
  },

  // small payload for UI (avoid heavy embeds)
  data: { type: Object, default: {} },

  // aggregate notify
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // read/delivery state
  isRead: { type: Boolean, default: false, index: true },
  isDelivered: { type: Boolean, default: false },

  // frontend navigation
  actionUrl: { type: String, default: null },

  // priority for ordering/aggregation
  priority: { type: Number, default: 0 }

}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// fast unread counts & pagination for a user
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// lookup by referenced object (e.g., cascade deletes)
notificationSchema.index({ refType: 1, refId: 1 });

// TTL: auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);