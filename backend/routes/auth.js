const express = require("express");
const router = express.Router();
const passport = require("passport");

const { sendOTP, singUp, login, refresh, logout, googleCallback,
     forgotPassword, resetPassword } = require("../controllers/auth");

const {auth} = require("../middlewares/auth");
const { getSession, terminateSession, terminateAllOtherSessions, terminateAllSessions } = require("../controllers/session");
const { otpLimiter } = require("../middlewares/rateLimiter");

router.get("/send-otp", otpLimiter, sendOTP);

// signup
router.post("/signup", singUp);

// login
router.post("/login", login);

// refresh JWT token
router.post("/refresh", refresh);

// logout and clear cookie and refresh token
router.post("/logout", logout);

// step1- opening gooogle login window
router.get("/oauth/google",passport.authenticate(
    "google",
    {
        scope: ["profile", "email"],
        session: false
    }
));

// step2 callback from google
router.get("/oauth/google/callback",
    passport.authenticate('google',{session: false}),
    googleCallback
);

// resetpass token
router.post("/forgot-password", otpLimiter, forgotPassword);

// reset password
router.post("/reset-password/:token", resetPassword);

// get all sessions
router.get("/sessions", auth, getSession);

// terminate single session by ID
router.delete("/sessions/:id", auth, terminateSession);

// terminate all session except current
router.delete("/sessions", auth, terminateAllOtherSessions);

// terminate all sessions
router.post("/terminate-all-sessions", auth, terminateAllSessions)

module.exports = router;