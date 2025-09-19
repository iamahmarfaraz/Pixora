const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // We store a HASH of the refresh token for security (never store raw tokens)
  // it's not the access token(JWT) rather this refresh token generates a new
  //access token when the access token expires
  refreshTokenHash: {
    type: String,
    required: true,
    index: true
  },

  // Device / client info for session management
  userAgent: { type: String, default: null },
  ip: { type: String, default: null },

  // Token lifecycle
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },  // e.g., now + 30 days
  revokedAt: { type: Date, default: null },

  //reason or replacement token id (rotation)
  replacedByTokenHash: { type: String, default: null }
}, {
  versionKey: false
});

// Quick queries
sessionSchema.index({ user: 1, createdAt: -1 });
sessionSchema.index({ refreshTokenHash: 1 });

// Optional: TTL cleanup (auto remove expired sessions).
// This will automatically delete a session when expiresAt is reached.
// Note: TTL may be slightly delayed depending on Mongo background job.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);