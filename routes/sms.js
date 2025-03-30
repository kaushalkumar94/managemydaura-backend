const express = require('express');
const router = express.Router();

// Import auth controller
const { sendSMSController } = require('../controllers/sendSMS');

// Register PA
router.post('/sendsms', sendSMSController);

module.exports = router;