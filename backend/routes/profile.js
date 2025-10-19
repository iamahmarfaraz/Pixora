const express = require("express");
const router = express.Router();

const {auth} = require("../middlewares/auth");
const { getMyProfile, updateProfile, updateAvatar } = require("../controllers/profile");
const upload = require("../middlewares/upload");

// get my prfole
router.get("/me", auth, getMyProfile);

// update profile
router.put("/update", auth, updateProfile);

// update avatar
router.put("/avatar", auth, upload.single("avatar"), updateAvatar);

module.exports = router;