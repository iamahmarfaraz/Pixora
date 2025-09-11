require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

const connectDB = require("./config/database");

let db;
db = connectDB();

app.get("/",(req,res) => {
    res.send("Pixora Backend is running");
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is Up and Running on http://localhost:${PORT}`);
})