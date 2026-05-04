const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const authmiddleware = require("../middleware/authmiddleware");

const multer = require("multer");
const pdfParse = require("pdf-parse");
const calculateATSScore = require("../utils/ats");

// ✅ ONLY ONE multer setup (memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= UPLOAD + ATS =================
router.post(
  "/upload",
  authmiddleware,
  upload.single("resume"),
  async (req, res) => {
    const userId = req.user.id;
    const jobDescription = req.body.jobDescription;

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("FILE RECEIVED:", req.file.originalname);

      // ✅ parse PDF (buffer exists now)
      const data = await pdfParse(req.file.buffer);
      const extractedText = data.text;

            // ✅ ATS score
      const atsResult = jobDescription
        ? calculateATSScore(extractedText, jobDescription)
        : null;

      const atsScore = atsResult ? atsResult.score : null;

      // ✅ save to DB (IMPORTANT: lowercase column name)
      const result = await pool.query(
        "INSERT INTO resumes (user_id, file_name, file_path, content, extractedtext, atsscore) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [userId, 
        req.file.originalname, 
        "memory", 
        extractedText, 
        extractedText, 
        atsScore]
      );



      res.json({
        message: "Resume uploaded & processed successfully ✅",
        resume: result.rows[0],
        ats: atsResult
    });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Processing failed" });
    }
  }
);

// ================= MANUAL SCORE =================
router.post("/score", async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  try {
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: "Missing data" });
    }

    const result = calculateATSScore(resumeText, jobDescription);

    res.json({
      ...result,
      message: "ATS score calculated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error calculating score" });
  }
});

// ================= RESUME INSIGHTS =================
router.get("/insights", authmiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, file_name, atsscore, uploaded_at 
       FROM resumes 
       WHERE user_id = $1 AND atsscore IS NOT NULL`,
      [userId]
    );

    const resumes = result.rows;

    if (resumes.length === 0) {
      return res.json({
        message: "No scored resumes found",
        insights: null
      });
    }

    // 🔹 Best resume
    const bestResume = resumes.reduce((best, current) =>
      current.atsscore > best.atsscore ? current : best
    );

    // 🔹 Average score
    const avgScore =
      resumes.reduce((sum, r) => sum + r.atsscore, 0) / resumes.length;

    // 🔹 Latest resume
    const latestResume = resumes.sort(
      (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
    )[0];

    res.json({
      totalResumes: resumes.length,
      averageScore: Math.round(avgScore),
      bestResume,
      latestResume,
      allResumes: resumes
    });

  } catch (err) {
    console.error("INSIGHTS ERROR:", err);
    res.status(500).json({ message: "Failed to get insights" });
  }
});

// ================= GET MY RESUMES =================
router.get("/my", authmiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, file_name, uploaded_at, atsScore
       FROM resumes 
       WHERE user_id = $1 
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    res.json({
      count: result.rows.length,
      resumes: result.rows
    });

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch resumes" });
  }
});

// ================= GET SINGLE RESUME =================
router.get("/:id", authmiddleware, async (req, res) => {
  const userId = req.user.id;
  const resumeId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT id, file_name, extractedtext, atsScore, uploaded_at
       FROM resumes
       WHERE id = $1 AND user_id = $2`,
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({
      resume: result.rows[0]
    });

  } catch (err) {
    console.error("FETCH ONE ERROR:", err);
    res.status(500).json({ message: "Error fetching resume" });
  }
});

// ================= DELETE RESUME =================
router.delete("/:id", authmiddleware, async (req, res) => {
  const userId = req.user.id;
  const resumeId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING *",
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found or unauthorized" });
    }

    res.json({
      message: "Resume deleted successfully ✅",
      deleted: result.rows[0]
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting resume" });
  }
});

// ================= RECALCULATE ATS =================
router.post("/:id/recalculate", authmiddleware, async (req, res) => {
  const userId = req.user.id;
  const resumeId = req.params.id;
  const { jobDescription } = req.body;

  try {
    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required" });
    }

    // 🔹 get resume from DB
    const result = await pool.query(
      "SELECT extractedtext FROM resumes WHERE id = $1 AND user_id = $2",
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resumeText = result.rows[0].extractedtext;

    // 🔹 calculate new ATS
    const atsResult = calculateATSScore(resumeText, jobDescription);
    const atsScore = atsResult.score;

    // 🔹 update DB
    await pool.query(
      "UPDATE resumes SET atsscore = $1 WHERE id = $2",
      [atsScore, resumeId]
    );

    res.json({
      message: "ATS score recalculated ✅",
      ats: atsResult
    });

  } catch (err) {
    console.error("RECALC ERROR:", err);
    res.status(500).json({ message: "Error recalculating ATS" });
  }
});

// ================= DOWNLOAD (TEXT) =================
router.get("/:id/download", authmiddleware, async (req, res) => {
  const userId = req.user.id;
  const resumeId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT file_name, extractedtext FROM resumes WHERE id = $1 AND user_id = $2",
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resume = result.rows[0];

    // 🔹 send as downloadable text file
    res.setHeader("Content-Disposition", `attachment; filename=${resume.file_name}.txt`);
    res.setHeader("Content-Type", "text/plain");

    res.send(resume.extractedtext);

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Error downloading resume" });
  }
});



module.exports = router;