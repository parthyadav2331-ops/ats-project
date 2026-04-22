const pool = require("../db");

const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    const result = await pool.query(
      "INSERT INTO resumes (user_id, file_name, file_url) VALUES ($1, $2, $3) RETURNING *",
      [userId, req.file.filename, filePath]
    );

    res.json({
      message: "Resume uploaded successfully",
      resume: result.rows[0],
    });

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadResume };