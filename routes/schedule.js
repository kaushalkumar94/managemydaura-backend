// routes/schedule.js
const express = require("express");
const router = express.Router();
const {
  createSchedule,
  getAllSchedules,
  deleteSchedule,
} = require("../controllers/scheduleController");
const { protect } = require("../middlewares/protect"); // if you want protected route
const { sendScheduleWhatsAppSMSController } = require("../controllers/sendSMS");

router.post("/create", protect, createSchedule); // or remove `protect` if not needed
router.get("/fetchall", protect, getAllSchedules); // fetch all the schedules for the user (filtered by email)
router.delete("/delete/:scheduleId", deleteSchedule); // delete schedule by ID

module.exports = router;
