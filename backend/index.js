// date +%Y%m%d%H%M%S

require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");
const PORT = process.env.PORT || 8080;
const passport = require("passport");
require("./config/passport")

const app = express();

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const postRoutes = require("./routes/post");

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin : "*",
        credentials: true,  //allow cookie to be send
    })
)
app.use(passport.initialize());

connectDB();

app.get("/",(req,res) => {
    res.send("Pixora Backend is running");
})

// ROUTES
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/post", postRoutes);

app.listen(PORT, ()=>{
    console.log(`Server is Up and Running on http://localhost:${PORT}`);
})