const Attendance = require('../models/Attendance');

exports.markAttendance = async (req, res) => {
    const { userId, eventId } = req.body;

    try {
        const attendance = new Attendance({ userId, eventId });
        await attendance.save();
        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error });
    }
};

exports.getAttendanceRecords = async (req, res) => {
    const { eventId } = req.params;

    try {
        const records = await Attendance.find({ eventId });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};