const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../models/Session");
const mailSender = require("../utils/mailSender");
const resetPasswordTemplate = require("../mailTemplates/resetPassword");
require("dotenv").config();

exports.sendOTP = async(req,res) => {
    try {
        
        // fetch email from response body
        const {email} = req.body;
        console.log("Incoming Email :- ",email);
        

        // check if we got email
        if(!email){
            return res.status(404).json({
                success: false,
                message: "Email is missing",
            })
        }

        // check if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already Registered",
            });
        }

        // otp generation
        let otp = otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        console.log("Generated OTP for testing :- ",otp);

        let otpExists = await OTP.findOne({otp});
        while(otpExists){
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            })
            otpExists = await OTP.findOne({otp});
        }

        // Save OTP in DB
        const otpDoc = await OTP.create({
            email,
            otp
        });
        console.log("OTP Saved",otpDoc);
        
        // return response
        return res.status(200).json({
            success: true,
            message: "OTP Sent Successfully",
        })
    
    } catch (error) {
        console.error("Error Sending OTP",error);
        return res.status(500).json({
            success: false,
            message: "Error while sending OTP",
        })
    }
};

exports.singUp = async (req,res) => {
    try {
        
        const {username, email, password, confirmPassword, otp, fullName} = req.body;

        // validation
        if(!username || !email || !password || !confirmPassword || !otp || !fullName){
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        if(password.length < 6){
            return res.status(400).json({
                success: false,
                message: "Password Must be longer than or equal to 6 characters"
            })
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password doesn't match"
            })
        }

        // check if user already exists
        const emailNorm = String(email).toLowerCase().trim();
        const existingUser = await User.findOne({$or:[{email: emailNorm},{username}]});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "Email or Username in use"
            })
        }

        // validate OTP
        const recentOtpArr = await OTP.find({email}).sort({createdAt : -1}).limit(1);
        if(!recentOtpArr || recentOtpArr.length === 0){
            return res.status(400).json({
                success: false,
                message: "OTP not found for this Email"
            })
        }
        const recentOtp = recentOtpArr[0];
        if(recentOtp.otp !== otp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // otp expire hua hai ya nhi check
        const otpAge = Date.now() - new Date(recentOtp.createdAt).getTime();
        if(otpAge > (5*60*1000)){
            return res.status(400).json({
                success: false,
                message: "OTP Expired"
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user = await User.create({
            username,
            email: emailNorm,
            password_hash: hashedPassword,
            fullName,
        })

        const profileDoc = await Profile.create({
            user: user._id
        });

        user.profile = profileDoc._id;
        await user.save();

        await OTP.deleteMany({email});

        // return response
        return res.status(201).json({
            success: true,
            message: "User registered",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        })

    } catch (error) {
        console.error("Singup Error :- ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.login = async(req,res) => {
    try {
        
        const {email,password} = req.body;

        // validate input
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            })
        }

        // check if user exists
        const emailNorm = String(email).toLowerCase().trim();
        const user = await User.findOne({email: emailNorm}).populate("profile");
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found, Please sing up first",
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: "Invalid credentails",
            })
        }

        // JWT payload
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        // create jwt-token
        const token = jwt.sign(payload, process.env.JWT_SECRET,{
            expiresIn: "2h",
        });

        // refresh token for session model
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const refreshTokenHash = crypto.createHash("sha256")
        .update(refreshToken)
        .digest("hex");

        await Session.create({
            user: user._id,
            refreshTokenHash,
            userAgent: req.get("user-agent") || null,
            ip: req.ip,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        // set cookie
        const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3 days
            httpOnly: true, //cookie only accesiblee by server
            secure: process.env.NODE_ENV === "production",  //http request in dev and http in prod
            sameSite: "lax",
        };

        const options2 = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days
            httpOnly: true, //cookie only accesiblee by server
            secure: process.env.NODE_ENV === "production",  //http request in dev and http in prod
            sameSite: "lax",
        };

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            profile: user.profile
        };

        res.cookie("token",token,options)
        .cookie("refreshToken", refreshToken,options2)
        .status(200).json({
            success: true,
            message: "Logged in Successfully",
            token,
            user: userResponse,
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
};

exports.refresh = async (req, res) => {
    try {
        
        // extract refreshToken from cookie
        const {refreshToken: raw} = req.cookies || {};
        if(!raw){
            return res.status(401).json({
                success: false,
                message: "Refresh token missing"
            })
        }

        // hash to refreshToken to match it in DB
        const hash = crypto.createHash('sha256').update(String(raw)).digest('hex');

        // find active session
        const session = await Session.findOne({
            refreshTokenHash: hash,
            revokedAt: null,
            expiresAt: {$gt: new Date()}
        }).populate('user');

        if(!session || !session.user){
            res.clearCookie('token');
            res.clearCookie('refreshToken');
            return res.status(401).json({
                success: false,
                message: "Refresh token invalid or expired"
            })
        }

        // generate new jwt token
        const user = session.user;
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        const newJWTToken = jwt.sign(payload, process.env.JWT_SECRET,{
            expiresIn: '2h'
        });

        const jwtOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge : 2 * 60 * 60 * 1000 //2h
        }

        const refreshTokenOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge : 30 * 60 * 60 * 1000 //2h
        }

        return res.cookie('token', newJWTToken, jwtOption)
        .cookie('refreshToken', raw, refreshTokenOption)
        .status(200).json({
            success: true,
            token: newJWTToken
        });

    } catch (error) {
        console.error("Refresh Token Error: ",error);
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        return res.status(500).json({
            success: false,
            message: "Internal Server error"
        })
    }
};

exports.logout = async(req,res) => {
    try {
        
        const {refreshToken: raw} = req.cookies || {};
        if(raw){
            // hash the refreshToken to lookup in DB
            const hash = crypto.createHash('sha256').update(String(raw)).digest('hex');

            await Session.findOneAndUpdate(
                {refreshTokenHash: hash , revokedAt: null},
                {revokedAt: new Date()}
            )
        }

        // clear cookie
        res.clearCookie("token");
        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "Logged out Successfully"
        })

    } catch (error) {
        console.error("Logout Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.googleCallback = async (req, res) => {
    try {
       
        const user = req.user;

        if(!user){
            return res.status(401).json({
                success: false,
                message: "Google authentication failed",
            })
        }

        // jwt payload
        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET,{
            expiresIn: "2h",
        });

        const refreshToken = crypto.randomBytes(40).toString("hex");
        const refreshTokenHash = crypto.createHash("sha256")
        .update(refreshToken)
        .digest("hex");

        await Session.create({
            user: user._id,
            refreshTokenHash,
            userAgent: req.get("user-agent") || null,
            ip: req.ip,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        // set cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        })
        .status(200).json({
            success: true,
            message: "Logged in with Google successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        })
        
    } catch (error) {
        console.error("Google OAuth callback error",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during Google OAuth callback"
        })
    }
};

// RESET PASSWORD TOKEN GENRATION AND MAIL SENDING
exports.forgotPassword = async(req,res) => {
    try {
        
        const {email} = req.body;
        if(!email){
            return  res.status(400).json({
                success: false,
                message: "Email required"
            })
        }

        const user = await User.findOne({email: email.toLowerCase().trim()});
        if(!user){
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            })
        }

        // generate resett token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // hash and save
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest('hex');
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;  //15 mint
        await user.save();

        // email link
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // send mail
        await mailSender(
            user.email,
            "Pixora Password Reset",
            resetPasswordTemplate({
                resetUrl,
                username: user.fullName || user.username,
                productName: "Pixora",
            })
        );

        return res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        })

    } catch (error) {
        console.error("Forgot Password Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.resetPassword = async(req,res) => {
    try {
        
        const {token} = req.params;
        const {password, confirmPassword} = req.body;

        if(!token){
            return res.status(404).json({
                success: false,
                message: "Token not found"
            })
        }

        if(!password || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password required"
            })
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password do not match"
            })
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpires : {$gt: Date.now()}
        });

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid or Expired token"
            })
        }

        user.password_hash = await bcrypt.hash(password, 10);
        user.resetPasswordExpires = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been changed successfully"
        })

    } catch (error) {
        console.error("Reset Pssword error : ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

