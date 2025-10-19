const Post = require("../models/Post");
const uploadFileToS3 = require("../utils/s3Uploader");
const User = require("../models/User");
const mongoose = require("mongoose");
const deleteFileFromS3 = require("../utils/s3Delete");
const Like = require("../models/Like");
const Comment = require("../models/Comment");

exports.createPost = async (req, res) => {
    try {
        
        const userId = req.user?.id;
        const files = req.files;
        const { caption, postType } = req.body;
        let { taggedUsers } = req.body;

        if(!userId || !files || files.length === 0){
            return res.status(400).json({
                success: false,
                message: "File and authetication are required"
            })
        }

        let taggedIds = [];
        if(taggedUsers){
            if(typeof taggedUsers === "string"){
                try {
                    taggedUsers = JSON.parse(taggedUsers);
                } catch (error) {
                    taggedUsers = taggedUsers.split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
            }

            if(Array.isArray(taggedUsers)){
                taggedIds = taggedUsers.filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
                .map(String);
            }
        }

        if(taggedIds.length > 0){
            const existing = await User.find(
                {_id: { $in: taggedIds}},
                {_id: 1}
            ).lean();
            taggedIds = existing.map((u) => String(u._id));
        }

        const mediaUpload = await Promise.all(
            files.map(async(file, index) => {
                const url = await uploadFileToS3(file.buffer, file.originalname, file.mimetype);

                const type = file.mimetype.startsWith("video") ? "video":"image";
                return {url, type, order:index};
            })
        );

        const post = await Post.create({
            user: userId,
            caption: caption?.trim() || "",
            postType: postType === "reel" ? "reel":"post",
            taggedUsers: taggedIds,
            media: mediaUpload,
        });

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            post,
        })

    } catch (error) {
        console.error("Create Post Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.getFeed = async(req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 15;
        const cursor = req.query.cursor;

        // if cursor provided onluy get post older than that cursor
        const query = cursor ? {_id : { $lt: cursor}} : {};

        const posts = await Post.find(query)
        .sort({_id: -1})
        .limit(limit)
        .populate("user", "username avatarUrl fullName")
        .populate("taggedUsers", "username avatarUrl");

        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

        return res.status(200).json({
            success: true,
            message: "Feed fetched successfully",
            count: posts.length,
            nextCursor,
            posts,
        })
 
    } catch (error) {
        console.error("Feed Fetch Error : ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.updatePost = async (req, res) => {
    try {
        
        const userId = req.user?.id;
        const { postId } = req.params;
        const { caption, postType, taggedUsers} = req.body;

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        if(String(post.user) !== String(userId)){
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can edit only your own posts",
            });
        }

        if(caption) post.caption = caption.trim();
        if(postType && ["post", "reel"].includes(postType))post.postType = postType;

        let taggedIds = [];
        if(taggedUsers){
            let parsed = taggedUsers;
            if(typeof taggedUsers === "string"){
                try {
                    parsed = JSON.parse(taggedUsers);
                } catch (error) {
                    parsed = taggedUsers.split(",").map((s) => s.trim()).filter(Boolean);
                }
            }
            if(Array.isArray(parsed)){
                taggedIds = parsed.filter((id) => mongoose.Types.ObjectId.isValid(id));
                const existing = await User.find({_id: {$in: taggedIds}}, {_id:1}).lean();
                post.taggedUsers = existing.map((u) => u._id);
            }
        }

        await post.save();


        const updatePost = await Post.findById(post._id)
        .populate("user", "username avatarUrl fullName")
        .populate("taggedUsers", "username avatarUrl");

        return res.status(200).json({
            success: true,
            message: "Post updated succcessfully",
            post: updatePost,
        })

    } catch (error) {
        console.error("Update Post Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.deletePost = async (req,res) => {
    try {
        
        const userId = req.user?.id;
        const {postId} = req.params;

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        // owenrship checking
        if(String(post.user) !== String(userId)){
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only delete your own posts"
            })
        }

        if(post.media && post.media.length > 0){
            const deletePromises = post.media.map((singleMedia) => deleteFileFromS3(singleMedia.url));
            await Promise.all(deletePromises);
        }

        await Post.findByIdAndDelete(postId);

        return res.status(200).json({
            success: false,
            message: "Post deleted successfully",
        })

    } catch (error) {
        console.error("Delete Post error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })
    }
};

exports.getSinglePost = async (req, res) => {
    try {
        
        const {postId} = req.params;

        if(!postId || !postId.match(/^[0-9a-fA-F]{24}$/)){
            return res.status(400).json({
                success: false,
                message: "Invalid post ID"
            })
        }

        const post = await Post.findById(postId)
        .populate("user", "username fullName avatarUrl ")
        .populate("taggedUsers", "username avatarUrl");

        if(!post){
            return res.status(404).json({
                success: false,
                message: "Post not found"
            })
        }

        const [likeCount, commentCount] = await Promise.all([
            Like.countDocuments({refType: "Post", refId: postId}),
            Comment.countDocuments({post: postId})
        ])

        const response = {
            _id: post._id,
            caption: post.caption,
            media: post.media,
            postType: post.postType,
            createdAt: post.createdAt,
            user: post.user,
            taggedUsers: post.taggedUsers,
            likeCount,
            commentCount,
        }

        return res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            post: response,
        })

    } catch (error) {
        console.error("Get Single Post Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

