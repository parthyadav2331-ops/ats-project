const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const auth = require("../middleware/authmiddleware");

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM settings WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ settings: result.rows[0] || null });
  } catch (err) {
    console.error("SETTINGS GET ERROR:", err);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.put("/", auth, async (req, res) => {
  const {
    company_name, company_website, company_size,
    default_interview_duration, resume_format,
    auto_screening, email_notifications, interview_reminders,
    email, password
  } = req.body;
  try {
    if (email) {
      await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, req.user.id]);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, req.user.id]);
    }

    const result = await pool.query(
      `INSERT INTO settings (user_id, company_name, company_website, company_size,
                             default_interview_duration, resume_format,
                             auto_screening, email_notifications, interview_reminders,
                             updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         company_website = EXCLUDED.company_website,
         company_size = EXCLUDED.company_size,
         default_interview_duration = EXCLUDED.default_interview_duration,
         resume_format = EXCLUDED.resume_format,
         auto_screening = EXCLUDED.auto_screening,
         email_notifications = EXCLUDED.email_notifications,
         interview_reminders = EXCLUDED.interview_reminders,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        company_name || null, company_website || null, company_size || null,
        default_interview_duration || null, resume_format || null,
        auto_screening !== undefined ? !!auto_screening : true,
        email_notifications !== undefined ? !!email_notifications : true,
        interview_reminders !== undefined ? !!interview_reminders : true
      ]
    );
    res.json({ settings: result.rows[0] });
  } catch (err) {
    console.error("SETTINGS UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
