const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getATSScore } = require("../controllers/atsController");

router.post("/score", authMiddleware, getATSScore);

module.exports = router;