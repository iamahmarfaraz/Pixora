const express = require("express");
const router = express.Router();

const { sendOTP, singUp } = require("../controllers/auth");

router.post("/send-otp", sendOTP);

// signup
router.post("/signup", singUp);

module.exports = router;