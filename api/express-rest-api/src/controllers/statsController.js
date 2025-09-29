const Stats = require('../models/Stats');

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const userStats = await Stats.find({ type: 'user' });
        res.status(200).json(userStats);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user statistics', error });
    }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
    try {
        const eventStats = await Stats.find({ type: 'event' });
        res.status(200).json(eventStats);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving event statistics', error });
    }
};