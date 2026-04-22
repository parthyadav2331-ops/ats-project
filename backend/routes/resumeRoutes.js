const express = require("express");
const router = express.Router();

const authmiddleware = require("../middleware/authmiddleware");
const upload = require("../middleware/uploadmiddleware");
const { uploadResume } = require("../controllers/resumeController");

// POST /resume/upload
router.post("/upload", authmiddleware, upload.single("resume"), uploadResume);

module.exports = router;