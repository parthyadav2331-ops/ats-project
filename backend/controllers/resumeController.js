const { pool } = require("../config/db");
const parseResume = require("../utils/parser");

const uploadResume = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileName = req.file.filename;
        const filePath = req.file.path;

        // 🔥 parse PDF
        const content = await parseResume(filePath);

        console.log("CONTENT lENGTH:", content.length);
        console.log("CONTENT SAMPLE:", content.slice(0,200));

        
        const result = await pool.query(
            "INSERT INTO resumes (user_id, file_name, file_path, content) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, fileName, filePath, content]
        );

        res.json({
            message: "Resume uploaded & parsed successfully",
            resume: result.rows[0],
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { uploadResume };