const Like = require("../models/Like");
const Post = require("../models/Post");
const eventBus = require("../utils/eventBus");

exports.togglePostLike = async (req, res) => {
    try {
        
        const userId = req.user?.id;
        const {postId} = req.params;

        if(!userId || !postId){
            return res.status(400).json({
                success: false,
                message: "User and postId are required"
            })
        }

        const post = await Post.findById(postId).select("user");
        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        const existingLike = await Like.findOne({
            user: userId,
            refType: "Post",
            refId: postId
        });

        if(existingLike){
            // uinlike
            await existingLike.deleteOne();

            eventBus.emit("post.unliked", {
                postId,
                actorId: userId,
                postOwnerId: post.user
            })

            const likeCount = await Like.countDocuments({refType: "Post", refId: postId});

            return res.status(200).json({
                success: true,
                message: "Post unliked",
                liked: false,
                likeCount,
            })
        }

        await Like.create({
            user: userId,
            refType: "Post",
            refId: postId
        })

        const likeCount = await Like.countDocuments({refType: "Post", refId: postId});

        eventBus.emit("post.liked", {
            postId,
            actorId: userId,
            postOwnerId: post.user,
        })

        return res.status(200).json({
            success: true,
            message: "Post liked",
            liked: true,
            likeCount
        })

    } catch (error) {
        console.error("Toogle Post Like error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};