const mongoose = require('mongoose');

const oauthAccountSchema = new mongoose.Schema({
  user: {
    
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },

  provider: {
    // e.g. 'google', 'facebook', 'github'
    type: String,
    required: true,
    index: true
  },

  providerId: {
    // provider-specific unique id for the user
    type: String,
    required: true,
    index: true
  },

  email: {
    // provider email (if available) for quick lookups
    type: String,
    default: null,
    index: true
  },

  displayName: {
    type: String,
    default: null
  },

  // optional tokens (be careful — consider encrypting or avoiding long-term storage)
  accessToken: { type: String, default: null },
  refreshToken: { type: String, default: null },

  // raw profile data from provider (store only what you need)
  profileRaw: { type: Object, default: {} },

  linkedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate provider-providerId entries
oauthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('OAuthAccount', oauthAccountSchema);