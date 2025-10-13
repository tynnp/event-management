const express = require('express');
const router = express.Router();
const { getAllSessions, deleteSession } = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllSessions);
router.delete('/:id', authMiddleware, deleteSession);

module.exports = router;
