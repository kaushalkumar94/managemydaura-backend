const express = require("express");
const router = express.Router();

// Import visit controller
const { createVisit, deleteVisit } = require("../controllers/visitController");
const { protect } = require("../middlewares/protect");

// Add Visit
router.post("/add", protect, createVisit);

// Delete Visit
router.delete("/delete/:visitId", protect, deleteVisit);

// // List Visits
// router.get('/list', listVisits);

module.exports = router;
