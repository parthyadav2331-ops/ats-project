const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🔐 IMPORT MIDDLEWARE (ADD THIS HERE)
const authmiddleware = require("./middleware/authmiddleware");

app.use(express.json());
app.use(cors());

const pool = require('./db');
const authRoutes = require('./routes/authRoutes');

console.log("Profile route loaded");

const resumeRoutes = require("./routes/resumeRoutes");

app.use("/resume", resumeRoutes);

// Routes
app.use("/auth", authRoutes);

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// ✅ DB test
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔐 ADD PROTECTED ROUTE HERE
app.get("/profile", authmiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
