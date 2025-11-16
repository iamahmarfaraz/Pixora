const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Post = require("../models/Post");
const eventBus = require("../utils/eventBus");
const mongoose = require("mongoose")
const Notification = require("../models/Notification");

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

exports.deleteComment = async(req, res) => {
    try {
        
        const userId = req.user?.id;
        const {commentId} = req.params;

        if(!userId || !commentId){
            return res.status(400).json({
                success: false,
                message: "User ID and commentId are required"
            })
        }

        if(!commentId.match(/^[0-9a-fA-F]{24}$/)){
            return res.status(400).json({
                success: false,
                message: "Invalid commentId format"
            })
        }

        const comment = await Comment.findById(commentId).select("user post parentComment");
        if(!comment){
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            })
        }

        const post = await Post.findById(comment.post).select("user");
        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        const isPostOwner = String(post.user) === String(userId);
        const isCommentOwner = String(comment.user) === String(userId);
        if(!isCommentOwner && !isPostOwner){
            return res.status(403).json({
                success: false,
                message: "Unauthorized: you can not delete this comment"
            })
        }

        const commentsToBeDeleted = [comment._id];
        if(!comment.parentComment){
            const replies = await Comment.find({parentComment: commentId}).select("_id");
            const replyIds = replies.map(r => r._id);
            commentsToBeDeleted.push(...replyIds);
        }

        // deleting like coressponding to that comment and its replies(if any)
        await Like.deleteMany({
            refType: "Comment",
            refId: {$in : commentsToBeDeleted}
        })

        // delete all coresspdinh noti
        await Notification.deleteMany({
            refType: "Comment",
            refId: {$in : commentsToBeDeleted}
        })

        await Comment.deleteMany({_id : {$in : commentsToBeDeleted}});

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfullt",
            deletedCount: commentsToBeDeleted.length
        })

    } catch (error) {
        console.error("Dlete Comment Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};