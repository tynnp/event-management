const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/events', statsController.eventStatistics);
router.get('/comments', statsController.commentStatistics);

module.exports = router;