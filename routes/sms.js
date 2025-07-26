const express = require("express");
const router = express.Router();
const { sendWhatsAppSMSController, sendScheduleWhatsAppSMSController } = require("../controllers/sendSMS");
const { protect } = require("../middlewares/protect");

// POST /api/sms/whatsapp
router.post("/whatsapp",protect, sendWhatsAppSMSController);

// POST /api/sms/schedule-whatsapp
router.post("/schedule-whatsapp", protect, sendScheduleWhatsAppSMSController);

module.exports = router;
