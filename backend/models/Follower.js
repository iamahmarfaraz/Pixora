const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema(
    {
        // the User who follows
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // The User Who is being Followed
        following: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true,
    }
);

// Indexing for fast lookup & unique so that no duplicate pair of follower+following
followerSchema.index(
    {
        follower:1,
        following:1
    },
    {
        unique:true
    }
);

module.exports = mongoose.model("Follower",followerSchema);