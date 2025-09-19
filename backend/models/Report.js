// backend/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  targetType: {
    type: String,
    enum: ['Post', 'Comment', 'User', 'Message', 'Story'],
    required: true,
    index: true
  },

  // Id of the document that is reported
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
    index: true
  },

  reasonCode: {
    type: String,
    enum: ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'NUDITY', 'VIOLENCE', 'OTHER'],
    required: true,
    index: true
  },

  details: {
    type: String,
    default: null,
    trim: true
  },

  // list of evidence URLs (images / screenshots)
  evidence: [{
    type: String
  }],

  // Admin workflow fields
  status: {
    type: String,
    enum: ['OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED'],
    default: 'OPEN',
    index: true
  },
  assignedTo: { // admin user handling this report
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  actionTaken: {
    type: String,
    default: null
  },

  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
}, {
  timestamps: false,
  versionKey: false
});

reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);