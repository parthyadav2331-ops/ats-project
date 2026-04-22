const express = require("express");
const router = express.Router();

console.log("AuthRoutes file loaded");

const { signup, login } = require("../controllers/authController");

router.get("/test", (req, res) => {
  res.send("Auth route working ✅");
});

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;