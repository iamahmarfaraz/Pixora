const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  order: {
    type: Number,
    default: 0
  }
});

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
  media: [mediaSchema],
  postType: {
    type: String,
    enum: ["post", "reel"],
    default: "post"
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