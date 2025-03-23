const express = require('express');
const router = express.Router();

// Import auth controller
const { registerPA, loginPA } = require('../controllers/authController');

// Register PA
router.post('/register', registerPA);

// Login PA
router.post('/login', loginPA);

module.exports = router;
// Compare this snippet from routes/visit.js: