const mysql = require("mysql2");
require("dotenv").config();

const connectDB = async() => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'pixora'
        })

        console.log("Database Connection Succesfull");
        return connection;
        
    } catch (error) {
        console.error("Database Connection Failed");
        process.exit(1);
    }
}

module.exports = connectDB;