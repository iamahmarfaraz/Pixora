const Comment = require("../models/Comment");
const Post = require("../models/Post");
const eventBus = require("../utils/eventBus");
const mongoose = require("mongoose")

exports.createComment = async(req, res) => {
    try {
        
        const userId = req.user?.id;
        const {postId} = req.params;
        const {content, parentComment} = req.body;

        if(!userId || !postId || !content || !content.trim()){
            return res.status(400).json({
                success: false,
                message: "postId, content and authentication are required"
            })
        }

        if(!postId.match(/^[0-9a-fA-F]{24}$/)){
            return res.status(400).json({
                success: false,
                message: "Invalid postId"
            })
        }

        const post = await Post.findById(postId).select("_id user");
        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        // validate parentcomment if procided
        let parent = null;
        if(parentComment){
            if(!String(parentComment).match(/^[0-9a-fA-F]{24}$/)){
                return res.status(400).json({
                    success: false,
                    message: "Invalid ParentComment id"
                })
            }
            parent = await Comment.findById(parentComment).select("post");
            if(!parent || String(parent.post) !== String(postId)){
                return res.status(400).json({
                    success: false,
                    message: "Parent comment not found or mismatched"
                })
            }
        }

        const comment = await Comment.create({
            post: postId,
            user: userId,
            content: content.trim(),
            parentComment: parent ? parent._id : null
        })

        const populated = await Comment.findById(comment._id)
        .populate("user", "username avatarUrl fullName")
        .lean();

        eventBus.emit("comment.created", {
            postId,
            commentId: comment._id,
            actorId: userId,
            postOwnerId: post.user,
            content: comment.content,
            parentComment: parent ? parent._id:null
        })

        return res.status(201).json({
            success: true,
            message: parent ? "Reply created" : "Comment created",
            comment: populated
        })

    } catch (error) {
        console.error("Create Comment Error: ",error);
        return res.status(500).json({
            success: true,
            message: "Internal server error"
        })
    }
};