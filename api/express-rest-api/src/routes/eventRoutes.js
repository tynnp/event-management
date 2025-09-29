const express = require('express');
const {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  listEvents
} = require('../controllers/eventController');

const router = express.Router();

// Event routes
router.post('/', createEvent); // Create a new event
router.get('/:id', getEvent); // Get a specific event by ID
router.put('/:id', updateEvent); // Update an existing event by ID
router.delete('/:id', deleteEvent); // Delete an event by ID
router.get('/', listEvents); // List all events

module.exports = router;