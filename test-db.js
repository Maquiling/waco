import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,       // Railway host
  user: process.env.DB_USER,       // Railway user
  password: process.env.DB_PASSWORD, // Railway password
  database: process.env.DB_NAME,   // Railway database
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error("❌ Connection failed:", err.message);
  } else {
    console.log("✅ Connected to Railway MySQL!");
  }
  db.end(); // close connection after test
});
