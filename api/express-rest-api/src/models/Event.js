//file: api/express-rest-api/src/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

eventSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;