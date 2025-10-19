const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const { createPost, getFeed, updatePost, deletePost, getSinglePost } = require("../controllers/post");

// create post
router.post("/create", auth, upload.array("media",10), createPost);

// get feed 
router.get("/feed", auth, getFeed);

// update post
router.put("/update/:postId", auth, updatePost);

// delete post
router.delete("/delete/:postId", auth, deletePost);

// get single post
router.get("/:postId", auth, getSinglePost);

module.exports = router;
