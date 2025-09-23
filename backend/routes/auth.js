const express = require("express");
const router = express.Router();

const { sendOTP, singUp, login } = require("../controllers/auth");

router.post("/send-otp", sendOTP);

// signup
router.post("/signup", singUp);

// login
router.post("/login", login);

module.exports = router;