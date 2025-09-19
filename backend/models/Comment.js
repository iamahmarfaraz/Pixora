const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",   // Nested replies
    default: null,
  }
}, { timestamps: true });

// Indexes for performance
commentSchema.index({ post: 1 });             // Load comments of a post fast
commentSchema.index({ user: 1 });             // Fetch comments of a user
commentSchema.index({ parentComment: 1 });   // Get replies of a comment fast

module.exports = mongoose.model("Comment", commentSchema);