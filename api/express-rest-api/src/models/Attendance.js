// file: src/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: String, // đổi từ ObjectId => String
        required: true,
    },
    eventId: {
        type: String, // đổi từ ObjectId => String
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
