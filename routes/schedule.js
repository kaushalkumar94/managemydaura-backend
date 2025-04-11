// routes/schedule.js
const express = require("express");
const router = express.Router();
const { createSchedule, getAllSchedules } = require("../controllers/scheduleController");
const { protect } = require("../middlewares/protect"); // if you want protected route

router.post("/create", createSchedule); // or remove `protect` if not needed
router.get("/fetchall", getAllSchedules); // fetch all the schedules

module.exports = router;
