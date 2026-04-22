const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title:          { type: String, required: true, trim: true },
    company:        { type: String, required: true },
    description:    { type: String, required: true },
    requiredBadges: [{ type: String }],
    requiredSkills: [{ type: String }],
    salary:         { type: String, default: 'Competitive' },
    location:       { type: String, default: 'Remote' },
    type:           { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
    postedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive:       { type: Boolean, default: true },
    createdAt:      { type: Date, default: Date.now }
});

jobSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
