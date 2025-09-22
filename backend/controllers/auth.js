const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");

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
        const existingUser = await User.findOne({$or:[{email},{username}]});
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
            email,
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

