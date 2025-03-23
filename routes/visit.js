const express = require('express');
const router = express.Router();

// Import visit controller
const { createVisit, deleteVisit } = require('../controllers/visitController');

// Add Visit
router.post('/add', createVisit);

// Delete Visit
router.delete('/delete/:visitId', deleteVisit);

// // List Visits
// router.get('/list', listVisits);

module.exports = router;