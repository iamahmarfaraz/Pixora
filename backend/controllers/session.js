const Session = require("../models/Session");
const crypto = require("crypto");

// get all session
exports.getSession = async(req,res) => {
    try {
        
        const sessions = await Session.find({
            user: req.user.id,
            revokedAt: null,
            expiresAt: {$gt: new Date()}
        }).select("-refreshTokenHash");  //hide sensitive data

        return res.status(200).json({
            success: true,
            message: `Session of ${req.user.username}`,
            sessions
        })

    } catch (error) {
        console.error("Get All Session error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

// terminate a single session by ID
exports.terminateSession = async(req,res) => {
    try {
        
        const {id} = req.params;

        const session = await Session.findOne({
            _id: id,
            user: req.user.id
        });

        if(!session){
            return res.status(404).json({
                success: false,
                message: "Session not found"
            })
        }

        session.revokedAt = new Date();
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Session terminated successfully"
        })

    } catch (error) {
        console.error("Terminate Session Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

// terminate all sessions except current
exports.terminateAllOtherSessions = async(req,res) => {
    try {
        
        const currentToken = req.cookies?.refreshToken;
        if(!currentToken){
            return res.status(401).json({
                success: false,
                message: "No Active refresh token found"
            })
        }

        const currentHash = crypto.createHash("sha256").update(String(currentToken)).digest('hex');

        await Session.updateMany(
            {
                user: req.user.id,
                refreshTokenHash: {$ne: currentHash},
                revokedAt: null
            },
            {
                $set: {revokedAt: new Date()}
            }
        );

        return res.status(200).json({
            success: true,
            message: "All other sessions terminated"
        })

    } catch (error) {
        console.error("Termiate All Sessions Error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

exports.terminateAllSessions = async(req, res) => {
    try {
        
        const userId = req.user.id;

        await Session.updateMany(
            {user: userId, revokedAt: null},
            {$set : {revokedAt: new Date()}}
        );

        // clear cookie
        res.clearCookie("token");
        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "All Sessions terminated successfully"
        })

    } catch (error) {
        console.error("Terminate all sessions error: ",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};