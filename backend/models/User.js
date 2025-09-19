const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // we will hash in controller and store hashed value here
    password_hash: {
      type: String,
      required: true
    },

    // put full name in User as you requested
    fullName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null
    },

    // account flags / auth related
    isPrivate: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    suspended: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    // avatar stored as URL (S3/Cloudinary later)
    avatarUrl: {
      type: String,
      default: null
    },

    // reference to Profile (we will create this later if we need)
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },

    // For password reset
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    }

  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

// Indexing to optimize DB queries
userSchema.index({ email: 1 });           // Fast login queries
userSchema.index({ username: 1 });        // Quick profile lookups

module.exports = mongoose.model('User', userSchema);