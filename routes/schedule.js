const express = require("express");
const router = express.Router();
const {
  createSchedule,
  getAllSchedules,
  deleteSchedule,
} = require("../controllers/scheduleController");

const { protect } = require("../middlewares/protect");
const { sendScheduleWhatsAppSMSController } = require("../controllers/sendSMS");

router.post("/create", protect, createSchedule);
router.get("/fetchall", protect, getAllSchedules); // filtered by email
router.delete("/delete/:scheduleId", protect, deleteSchedule);

module.exports = router;
