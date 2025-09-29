const express = require('express');
const { getUserProfile, updateUserProfile, deleteUser } = require('../controllers/userController');

const router = express.Router();

// Route to get user profile
router.get('/profile', getUserProfile);

// Route to update user profile
router.put('/profile', updateUserProfile);

// Route to delete user
router.delete('/profile', deleteUser);

module.exports = router;