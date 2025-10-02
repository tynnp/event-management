//file: api/express-rest-api/src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventDetail);
router.put('/:id/approve', authMiddleware, eventController.approveEvent);
router.put('/:id/reject', authMiddleware, eventController.rejectEvent);

module.exports = router;