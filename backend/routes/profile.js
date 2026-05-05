const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");

const parseSkills = (raw) => {
  if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

router.get("/", auth, async (req, res) => {
  try {
    const userRes = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    const profileRes = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [req.user.id]
    );
    const stats = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM applications WHERE applicant_id = $1) AS applied,
        (SELECT COUNT(*) FROM applications WHERE applicant_id = $1 AND status IN ('shortlisted','interview','hired')) AS shortlisted,
        (SELECT COALESCE(MAX(atsscore),0) FROM resumes WHERE user_id = $1) AS best_score`,
      [req.user.id]
    );
    res.json({
      user: userRes.rows[0],
      profile: profileRes.rows[0] || null,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/", auth, async (req, res) => {
  const {
    name, phone, location, linkedin, current_role,
    experience, expected_salary, skills
  } = req.body;
  try {
    if (name) {
      await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name, req.user.id]);
    }
    const result = await pool.query(
      `INSERT INTO profiles (user_id, phone, location, linkedin, current_role,
                             experience, expected_salary, skills, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         phone = EXCLUDED.phone,
         location = EXCLUDED.location,
         linkedin = EXCLUDED.linkedin,
         current_role = EXCLUDED.current_role,
         experience = EXCLUDED.experience,
         expected_salary = EXCLUDED.expected_salary,
         skills = EXCLUDED.skills,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id, phone || null, location || null, linkedin || null,
        current_role || null, experience || null, expected_salary || null,
        parseSkills(skills)
      ]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
