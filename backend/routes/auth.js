const express = require("express");
const router = express.Router();

const { sendOTP, singUp, login, refresh } = require("../controllers/auth");

router.post("/send-otp", sendOTP);

// signup
router.post("/signup", singUp);

// login
router.post("/login", login);

// refresh JWT token
router.post("/refresh", refresh);

module.exports = router;