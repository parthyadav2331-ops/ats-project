const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");

// LIST (recruiter sees own; user sees own scheduled)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role === "recruiter") {
      const result = await pool.query(
        `SELECT i.*, u.name AS candidate, u.email,
                j.title AS position
         FROM interviews i
         JOIN applications a ON a.id = i.application_id
         JOIN users u ON u.id = a.applicant_id
         JOIN jobs j ON j.id = a.job_id
         WHERE j.recruiter_id = $1
         ORDER BY i.scheduled_at ASC`,
        [req.user.id]
      );
      return res.json({ interviews: result.rows });
    }
    const result = await pool.query(
      `SELECT i.*, j.title AS position, j.company
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN jobs j ON j.id = a.job_id
       WHERE a.applicant_id = $1
       ORDER BY i.scheduled_at ASC`,
      [req.user.id]
    );
    res.json({ interviews: result.rows });
  } catch (err) {
    console.error("INTERVIEWS LIST ERROR:", err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
});

// SCHEDULE (recruiter)
router.post("/", auth, requireRole("recruiter"), async (req, res) => {
  const { application_id, scheduled_at, interviewer, notes } = req.body;
  if (!application_id || !scheduled_at)
    return res.status(400).json({ message: "application_id and scheduled_at required" });

  try {
    const own = await pool.query(
      `SELECT 1 FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = $1 AND j.recruiter_id = $2`,
      [application_id, req.user.id]
    );
    if (!own.rows.length) return res.status(404).json({ message: "Not allowed" });

    const result = await pool.query(
      `INSERT INTO interviews (application_id, scheduled_at, interviewer, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [application_id, scheduled_at, interviewer || null, notes || null]
    );
    await pool.query(
      "UPDATE applications SET status = 'interview' WHERE id = $1",
      [application_id]
    );
    res.status(201).json({ interview: result.rows[0] });
  } catch (err) {
    console.error("INTERVIEW SCHEDULE ERROR:", err);
    res.status(500).json({ message: "Failed to schedule" });
  }
});

// UPDATE STATUS (recruiter)
router.put("/:id", auth, requireRole("recruiter"), async (req, res) => {
  const { status, notes, scheduled_at, interviewer } = req.body;
  try {
    const result = await pool.query(
      `UPDATE interviews i
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           scheduled_at = COALESCE($3, scheduled_at),
           interviewer = COALESCE($4, interviewer)
       FROM applications a, jobs j
       WHERE i.id = $5 AND a.id = i.application_id AND j.id = a.job_id
             AND j.recruiter_id = $6
       RETURNING i.*`,
      [status || null, notes || null, scheduled_at || null,
       interviewer || null, req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ interview: result.rows[0] });
  } catch (err) {
    console.error("INTERVIEW UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update" });
  }
});

module.exports = router;
