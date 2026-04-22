const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    source:     { type: String, default: 'landing-page' },
    signupDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Waitlist', waitlistSchema);
