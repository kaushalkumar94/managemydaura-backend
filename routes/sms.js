const express = require("express");
const router = express.Router();

// Import auth controller
const {
  sendSMSController,
  sendScheduleSMSController,
  twilioWhatsAppController,
} = require("../controllers/sendSMS");

// Register PA
router.post("/sendsms", sendSMSController);
router.post("/sendschedule", sendScheduleSMSController);
router.post("/sendwhatsappvisit", twilioWhatsAppController);

module.exports = router;
