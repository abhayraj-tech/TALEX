const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name:         { type: String, required: true, unique: true, trim: true },
    icon:         { type: String, default: '🏅' },
    description:  { type: String, required: true },
    tier:         { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    requirements: { type: String, required: true },
    holders:      { type: Number, default: 0 },
    category:     { type: String, default: 'General' },
    createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);
