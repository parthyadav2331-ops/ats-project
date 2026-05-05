const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const { connectDB, pool } = require("./config/db");
connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Serve frontend statically so the whole app runs from one origin
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/ats", require("./routes/ats"));
app.use("/api/protected", require("./routes/protected"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/interviews", require("./routes/interviews"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/analytics", require("./routes/analytics"));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
