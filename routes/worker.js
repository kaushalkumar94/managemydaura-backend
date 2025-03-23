const express = require('express');
const router = express.Router();

// Import worker controller
const { addWorker, listWorkers } = require('../controllers/workerController');

// Add Worker
router.post('/add', addWorker);

// List Workers
router.get('/list', listWorkers);

module.exports = router;
