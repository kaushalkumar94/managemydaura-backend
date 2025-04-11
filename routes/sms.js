const express = require('express');
const router = express.Router();

// Import auth controller
const { sendSMSController, sendScheduleSMSController } = require('../controllers/sendSMS');

// Register PA
router.post('/sendsms', sendSMSController);
router.post('/sendschedule', sendScheduleSMSController);

module.exports = router;