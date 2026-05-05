const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");

const parseSkills = (raw) => {
  if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// LIST (public-ish: any logged-in user)
router.get("/", auth, async (req, res) => {
  try {
    const { q, type, experience } = req.query;
    const conditions = [];
    const values = [];
    if (q) {
      values.push(`%${q.toLowerCase()}%`);
      conditions.push(
        `(LOWER(title) LIKE $${values.length} OR LOWER(company) LIKE $${values.length})`
      );
    }
    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    if (experience) {
      values.push(experience);
      conditions.push(`experience = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT j.*, u.name AS recruiter_name
       FROM jobs j JOIN users u ON u.id = j.recruiter_id
       ${where}
       ORDER BY j.created_at DESC`,
      values
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    console.error("JOBS LIST ERROR:", err);
    res.status(500).json({ message: "Failed to list jobs" });
  }
});

// MY POSTED JOBS (recruiter)
router.get("/mine", auth, requireRole("recruiter"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       WHERE j.recruiter_id = $1
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json({ jobs: result.rows });
  } catch (err) {
    console.error("MY JOBS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch your jobs" });
  }
});

// GET ONE
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, u.name AS recruiter_name
       FROM jobs j JOIN users u ON u.id = j.recruiter_id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Not found" });
    res.json({ job: result.rows[0] });
  } catch (err) {
    console.error("JOB GET ERROR:", err);
    res.status(500).json({ message: "Failed to fetch job" });
  }
});

// CREATE (recruiter)
router.post("/", auth, requireRole("recruiter"), async (req, res) => {
  try {
    const {
      title, company, department, location, type, experience,
      salary, description, skills, deadline, min_score
    } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    const result = await pool.query(
      `INSERT INTO jobs
        (recruiter_id, title, company, department, location, type, experience,
         salary, description, skills, deadline, min_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.user.id, title, company || null, department || null,
        location || null, type || null, experience || null, salary || null,
        description || null, parseSkills(skills),
        deadline || null, Number(min_score) || 0
      ]
    );
    res.status(201).json({ job: result.rows[0] });
  } catch (err) {
    console.error("JOB CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create job" });
  }
});

// DELETE (recruiter, own job)
router.delete("/:id", auth, requireRole("recruiter"), async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM jobs WHERE id = $1 AND recruiter_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error("JOB DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
});

module.exports = router;
