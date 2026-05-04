const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("Server file started...");

const app = express();

// DB import
const { connectDB, pool } = require("./config/db");

// 🔌 connect DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 🔥 ADD AUTH ROUTES HERE
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// routes
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const authMiddleware = require("./middleware/authmiddleware");
app.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Access granted",
        user: req.user
    });
});

// 🔥 ADD RESUME ROUTES HERE
const resumeRoutes = require("./routes/resume");
app.use("/api/resume", resumeRoutes);

const atsRoutes = require("./routes/ats");
app.use("/api/ats", atsRoutes);

const protectedRoutes = require('./routes/protected');
app.use('/api/protected', protectedRoutes);

// PORT
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});