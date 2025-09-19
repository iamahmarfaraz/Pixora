const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",     // Post owner
    required: true,
  },
  caption: {
    type: String,
    trim: true,
  },
  mediaUrl: {
    type: String,    // Cloudinary / S3 URL
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  taggedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // Users tagged in this post
    }
  ]
}, { timestamps: true });


postSchema.index({ user: 1 }); 
postSchema.index({ caption: "text" }); 

module.exports = mongoose.model("Post", postSchema);