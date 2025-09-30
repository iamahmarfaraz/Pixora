const User = require("../models/User");
const OAuthAccount = require("../models/OAuthAccount");
const crypto = require("crypto");
const bcrypt = require("bcrypt")

async function handleGoogleOAuth(profile, accessToken, refreshToken) {
    try {
        
        // Check if account already exist
        const existingUser = await OAuthAccount.findOne({
            provider: "google",
            providerId: profile.id
        }).populate("user");

        if(existingUser && existingUser.user){
            if (refreshToken) {
                existingUser.refreshToken = crypto.createHash("sha256")
                .update(String(refreshToken))
                .digest("hex")
                await existingUser.save().catch(()=>{});
            }
            return existingUser.user;
        }

        // if no accoun check if user exists by this email
        let email = profile.emails?.[0]?.value?.toLowerCase().trim() || null;
        let user = await User.findOne({email});

        if (!user) {
            const base = (profile.displayName || email?.split("@")[0] || "google_user")
                .toLowerCase()
                .replace(/[^a-z0-9._-]/g, "_")
                .slice(0, 30);

            let candidate = base;
            let suffix = 0;

            while (await User.findOne({ username: candidate })) {
                suffix++;
                candidate = `${base}_${suffix}`;
                if (suffix > 1000) {
                candidate = `${base}_${Date.now()}`;
                break;
                }
            }

            const dummyHash = await bcrypt.hash(crypto.randomBytes(20).toString("hex"), 10);

            user = await User.create({
                username: candidate,
                email,
                fullName: profile.displayName || null,
                password_hash: dummyHash
            })
        }

        // link OAuth acc
        const refreshTokenHash = refreshToken ? crypto.createHash("sha256")
        .update(String(refreshToken))
        .digest("hex") : null;

        await OAuthAccount.create({
            user: user._id,
            provider: "google",
            providerId: profile.id,
            email,
            displayName: profile.displayName || null,
            refreshToken: refreshTokenHash,
            profileRaw: profile._json || {}
        });

        return user;

    } catch (error) {
        console.error("Google OAuth Error: ",error);
        throw error;
    }
};

module.exports = handleGoogleOAuth;