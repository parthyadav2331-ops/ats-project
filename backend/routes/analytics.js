const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");

// RECRUITER OVERVIEW (cards + charts)
router.get("/recruiter", auth, requireRole("recruiter"), async (req, res) => {
  const r = req.user.id;
  try {
    const cards = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id
           WHERE j.recruiter_id = $1) AS total_applicants,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id
           WHERE j.recruiter_id = $1 AND a.status IN ('shortlisted','interview','hired')) AS shortlisted,
        (SELECT COUNT(*) FROM interviews i
           JOIN applications a ON a.id = i.application_id
           JOIN jobs j ON j.id = a.job_id
           WHERE j.recruiter_id = $1) AS interviews,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id
           WHERE j.recruiter_id = $1 AND a.status = 'hired') AS hired`,
      [r]
    );

    const perJob = await pool.query(
      `SELECT j.title, COUNT(a.id) AS count
       FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.recruiter_id = $1
       GROUP BY j.id ORDER BY j.created_at DESC LIMIT 8`,
      [r]
    );

    const pipeline = await pool.query(
      `SELECT a.status, COUNT(*) AS count
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE j.recruiter_id = $1
       GROUP BY a.status`,
      [r]
    );

    const monthly = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', a.applied_at), 'Mon') AS month,
              COUNT(*) AS count
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE j.recruiter_id = $1
         AND a.applied_at > NOW() - INTERVAL '6 months'
       GROUP BY date_trunc('month', a.applied_at)
       ORDER BY date_trunc('month', a.applied_at)`,
      [r]
    );

    res.json({
      cards: cards.rows[0],
      perJob: perJob.rows,
      pipeline: pipeline.rows,
      monthly: monthly.rows
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

// JOB SEEKER DASHBOARD STATS
router.get("/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM resumes WHERE user_id = $1) AS total_resumes,
        (SELECT COALESCE(AVG(atsscore),0) FROM resumes WHERE user_id = $1) AS avg_score,
        (SELECT COALESCE(MAX(atsscore),0) FROM resumes WHERE user_id = $1) AS best_score,
        (SELECT COUNT(*) FROM applications WHERE applicant_id = $1) AS applications,
        (SELECT atsscore FROM resumes WHERE user_id = $1
          ORDER BY uploaded_at DESC LIMIT 1) AS latest_score`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("ANALYTICS ME ERROR:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

module.exports = router;
