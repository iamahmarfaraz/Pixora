const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const { createPost, getFeed, updatePost, deletePost, getSinglePost, getReelsFeed } = require("../controllers/post");
const { togglePostLike } = require("../controllers/like");
const { createComment } = require("../controllers/comment");

// create post
router.post("/create", auth, upload.array("media",10), createPost);

// get feed 
router.get("/feed", auth, getFeed);

// gett all reels feed
router.get("/reels", auth, getReelsFeed);

// update post
router.put("/update/:postId", auth, updatePost);

// delete post
router.delete("/delete/:postId", auth, deletePost);

// get single post
router.get("/:postId", auth, getSinglePost);

// Like/Unlike a Post
router.post("/:postId/like", auth, togglePostLike);

// create Comment or Comment reply
router.post("/:postId/comment", auth, createComment);

module.exports = router;
