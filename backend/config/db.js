const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const runMigrations = async () => {
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(sql);
    console.log("Schema migrated ✅");
};

const connectDB = async () => {
    try {
        await pool.query("SELECT 1");
        console.log("Database connected ✅");
        await runMigrations();
    } catch (err) {
        console.error("Database connection failed ❌:", err.message);
    }
};

module.exports = { pool, connectDB };
