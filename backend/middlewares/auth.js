const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

exports.auth = async(req, res, next) => {
    try {
        
        // extract token from possible sources
        const token = req.cookies?.token ||
        req.body?.token ||
        req.header("Authorization")?.replace("Bearer ", "");

        // basic validation
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token not found, Please login again."
            })
        }

        try {
            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;  //{id,usrname,email,role}

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            })
        }

    } catch (error) {
        console.error("Auth middleware error: ",error);
        return res.status(500).json({
            success: false,
            message: "Authentication Failed",
        });
    }
};

exports.isUser = async (req,res,next) => {
    if(req.user.role !== "user"){
        return res.status(403).json({
            success: false,
            message: "Access denied: Users only",
        });
    }
    next();
};

exports.isAdmin = async(req, res, next) => {
    if(req.user.role !== "admin"){
        return res.status(403).json({
            success: false,
            message: "Access denied: Admins only",
        })
    }
    next();
}