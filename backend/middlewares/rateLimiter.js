const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) =>{
        return req.body?.email?.toLowerCase() || req.ip;
    },
    message: {
        success: false,
        message: "Too many OTP requests, Please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
})

module.exports = {otpLimiter};