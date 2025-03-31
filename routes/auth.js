const express = require("express");
const router = express.Router();

// Import auth controller
const {
  registerPA,
  loginPA,
  logoutPA,
  refreshAccessToken,
} = require("../controllers/authController");

// Register PA
router.post("/register", registerPA);

// Login PA
router.post("/login", loginPA);

// Logout PA
router.get("/logout", logoutPA);

// Refresh endpoint
router.get("/refresh", refreshAccessToken);

module.exports = router;
// Compare this snippet from routes/visit.js:
