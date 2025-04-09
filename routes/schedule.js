// routes/schedule.js
const express = require("express");
const router = express.Router();
const { createSchedule } = require("../controllers/scheduleController");
const { protect } = require("../middlewares/protect"); // if you want protected route

router.post("/create", createSchedule); // or remove `protect` if not needed

module.exports = router;
