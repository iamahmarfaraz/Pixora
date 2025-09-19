// date +%Y%m%d%H%M%S

require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin : "http://localhost:3000",
        credentials: true,  //allow cookie to be send
    })
)

const connectDB = require("./config/database");

connectDB();

app.get("/",(req,res) => {
    res.send("Pixora Backend is running");
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is Up and Running on http://localhost:${PORT}`);
})