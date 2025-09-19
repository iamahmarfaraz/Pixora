const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        refType: {
            type: String,
            enum: ["Post","Comment"],
            required: true
        },
        refId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath : "refType"
        }
    },
    {
        timestamps: true
    }
);

// Prevents duplicate likes by the same user on the same item
likeSchema.index({ user: 1, refType: 1, refId: 1 }, { unique: true });

// Optimizes queries like "likes on this post" or "likes by this user"
likeSchema.index({ refId: 1, refType: 1 });
likeSchema.index({ user: 1 });

module.exports = mongoose.model("Like", likeSchema);