const express = require('express');
const router = express.Router();

// Import worker controller
const { addWorkers, listWorkers } = require('../controllers/workerController');
const { protect } = require('../middlewares/protect');

// Add Worker
router.post('/add', protect, addWorkers);

// List Workers
router.get('/list', protect, listWorkers);

module.exports = router;
