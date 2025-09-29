const express = require('express');
const { registerUser, loginUser, authorizeUser } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/authorize', authorizeUser);

module.exports = router;