const express = require('express');
const router = express.Router();
const authmiddleware = require('../middleware/authmiddleware');

router.get('/dashboard', authmiddleware, (req, res) => {
  res.json({
    message: "Welcome to dashboard 🎉",
    user: req.user
  });
});

module.exports = router;