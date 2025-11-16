const Like = require("../models/Like");
const Post = require("../models/Post");
const eventBus = require("../utils/eventBus");
const Comment = require("../models/Comment");


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

        const post = await Post.findById(postId).select("user postType");
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
                postOwnerId: post.user,
                postType: post.postType || "post"
            })

            const likeCount = await Like.countDocuments({refType: "Post", refId: postId});

            return res.status(200).json({
                success: true,
                message: `${post.postType === "reel" ? "Reel" : "Post"} unliked`,
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
            postType: post.postType || "post"
        })

        return res.status(200).json({
            success: true,
            message: `${post.postType === "reel" ? "Reel" : "Post"} liked`,
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

exports.toggleCommentLike = async(req, res) => {
    try {
        
        const userId = req.user?.id;
        const { commentId } = req.params;

        // validtion
        if(!userId || !commentId){
            return res.status(400).json({
                success: false,
                message: "User and Comment Id are required"
            })
        }
        if(!commentId.match(/^[0-9a-fA-F]{24}$/)){
            return res.status(400).json({
                success: false,
                message: "Invalid commentId"
            })
        }

        const comment = await Comment.findById(commentId).select("_id");
        if(!comment){
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            })
        }

        const existingLike = await Like.findOne({
            user: userId,
            refType: "Comment",
            refId: commentId
        });

        if(existingLike){
            // unlike
            await existingLike.deleteOne();
            const likeCount = await Like.countDocuments({refType: "Comment", refId: commentId});

            return res.status(200).json({
                success: true,
                message: "Comment unliked",
                liked: false,
                likeCount
            })
        }

        await Like.create({
            user: userId,
            refType: "Comment",
            refId: commentId
        });

        const likeCount = await Like.countDocuments({refType: "Comment", refId: commentId});

        return res.status(200).json({
            success: true,
            message: "Comment Liked",
            liked: true,
            likeCount
        })

    } catch (error) {
        console.error("Toggle Comment Like error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};