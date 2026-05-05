const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");
const calculateATSScore = require("../utils/ats");

const upload = multer({ storage: multer.memoryStorage() });

// APPLY (job seeker) — supports either an uploaded resume file or an existing resume_id
router.post("/", auth, upload.single("resume"), async (req, res) => {
  const userId = req.user.id;
  const { job_id, resume_id } = req.body;

  if (!job_id) return res.status(400).json({ message: "job_id required" });

  try {
    const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [job_id]);
    if (!jobRes.rows.length) return res.status(404).json({ message: "Job not found" });
    const job = jobRes.rows[0];

    let resumeRow;
    if (req.file) {
      const data = await pdfParse(req.file.buffer);
      const inserted = await pool.query(
        `INSERT INTO resumes (user_id, file_name, file_path, content, extractedtext)
         VALUES ($1,$2,'memory',$3,$3) RETURNING *`,
        [userId, req.file.originalname, data.text]
      );
      resumeRow = inserted.rows[0];
    } else if (resume_id) {
      const r = await pool.query(
        "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
        [resume_id, userId]
      );
      if (!r.rows.length) return res.status(404).json({ message: "Resume not found" });
      resumeRow = r.rows[0];
    } else {
      return res.status(400).json({ message: "Upload a resume or pass resume_id" });
    }

    const jobText = [
      job.title, job.description, (job.skills || []).join(" ")
    ].filter(Boolean).join(" ");
    const ats = calculateATSScore(resumeRow.extractedtext || resumeRow.content || "", jobText);

    const inserted = await pool.query(
      `INSERT INTO applications (job_id, applicant_id, resume_id, ats_score, status)
       VALUES ($1,$2,$3,$4,'applied')
       ON CONFLICT (job_id, applicant_id)
       DO UPDATE SET resume_id = EXCLUDED.resume_id,
                     ats_score = EXCLUDED.ats_score,
                     status = 'applied',
                     applied_at = NOW()
       RETURNING *`,
      [job_id, userId, resumeRow.id, ats.score]
    );

    res.status(201).json({ application: inserted.rows[0], ats });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    res.status(500).json({ message: "Failed to apply" });
  }
});

// MY APPLICATIONS (job seeker)
router.get("/mine", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.title, j.company, j.location, j.type
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE a.applicant_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (err) {
    console.error("MY APPLICATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// APPLICANTS FOR ALL MY JOBS (recruiter)
router.get("/recruiter", auth, requireRole("recruiter"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.status, a.ats_score, a.applied_at,
              u.id AS applicant_id, u.name, u.email,
              j.id AS job_id, j.title AS position
       FROM applications a
       JOIN users u ON u.id = a.applicant_id
       JOIN jobs j ON j.id = a.job_id
       WHERE j.recruiter_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json({ applicants: result.rows });
  } catch (err) {
    console.error("RECRUITER APPS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

// UPDATE STATUS (recruiter)
router.put("/:id/status", auth, requireRole("recruiter"), async (req, res) => {
  const { status } = req.body;
  const allowed = ["applied", "shortlisted", "interview", "rejected", "hired"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    const result = await pool.query(
      `UPDATE applications a
       SET status = $1
       FROM jobs j
       WHERE a.id = $2 AND a.job_id = j.id AND j.recruiter_id = $3
       RETURNING a.*`,
      [status, req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Not found or unauthorized" });
    res.json({ application: result.rows[0] });
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;
