const { pool } = require("../config/db");
const calculateATSScore = require("../utils/ats");

const getATSScore = async (req, res) => {
    try {
        const { resumeId, jobDescription } = req.body;

        // fetch resume content
        const result = await pool.query(
            "SELECT content FROM resumes WHERE id = $1",
            [resumeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Resume not found" });
        }

        const resumeText = result.rows[0].content;

        if (!resumeText) {
            return res.status(400).json({ message: "Resume not parsed yet. Please upload again" });
        }

        const atsResult = calculateATSScore(resumeText, jobDescription);

        res.json({
            message: "ATS score calculated",
            ats: atsResult
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getATSScore };