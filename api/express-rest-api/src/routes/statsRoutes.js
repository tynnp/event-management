const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Route to get user statistics
router.get('/user-stats', statsController.getUserStats);

// Route to get event statistics
router.get('/event-stats', statsController.getEventStats);

module.exports = router;