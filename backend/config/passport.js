const passport = require("passport");
const handleGoogleOAuth = require("../services/oauthService");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        async(accessToken, refreshToken, profile, done) => {
            try {
                
                const user = await handleGoogleOAuth(profile, accessToken, refreshToken);  //function we written which handles User creation inDB using OAuth

                return done(null,user);
            } catch (error) {
                console.error("Google OAuth Error: ".error);
                return done(error,null);
            }
        }
    )
)

// Minimal serialize/deserialize (required by passport)
// session management - but we did minimal cause we handling session on our own with JWT
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // You could look up user again here if sessions are enabled
  done(null, { id });
});


module.exports = passport;