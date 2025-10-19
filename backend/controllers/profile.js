const User = require("../models/User");
const Profile = require("../models/Profile");
const uploadFileToS3 = require("../utils/s3Uploader");
const deleteFileFromS3 = require("../utils/s3Delete");

exports.getMyProfile = async(req, res) => {
    try {
        
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        const user = await User.findById(userId)
        .select("username email fullName role avatarUrl profile")
        .populate('profile', "phone bio website");

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not Found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Profile Fetched successfully",
            user,
        })

    } catch (error) {
        console.error("Get Profile error: ",error);
        return res.status(500).json({
            success: true,
            message: "Internal server error"
        })
    }
};

exports.updateProfile = async (req,res) => {
    try {
        
        const userId = req.user.id;
        const {fullName, phone, bio, website} = req.body;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const profile = await Profile.findById(user.profile);
        if(!profile){
            return res.status(404).json({
                success: false,
                message: "Profile not foundd"
            })
        }

        if(fullName)user.fullName = fullName.trim();
        if(phone) profile.phone = phone.trim();
        if(bio) profile.bio = bio.trim();
        if(website) profile.website = website.trim();

        await user.save();
        await profile.save();

        const updateUser = await User.findById(userId)
        .select("username email fullName avatarUrl role")
        .populate("profile", "phone bio website");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updateUser
        })

    } catch (error) {
        console.error("Update Profile error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.updateAvatar = async (req,res) => {
    try {
       
        const userId = req.user?.id;
        const file = req.file;

        if(!file){
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            })
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const oldAvatar = user.avatarUrl;

        const fileUrl = await uploadFileToS3(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        user.avatarUrl = fileUrl;
        await user.save();

        if(oldAvatar && String(oldAvatar).includes(process.env.S3_BUCKET)){
            try {
                await deleteFileFromS3(oldAvatar);
            } catch (error) {
                console.warn("Failed to delete old avatar", error?.message || error);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully",
            avatarUrl: fileUrl
        })
        
    } catch (error) {
        console.error("Avatar upload error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};