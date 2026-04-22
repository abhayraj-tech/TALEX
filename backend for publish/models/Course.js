const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, required: true, index: true },
    difficulty:  { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    creditCost:  { type: Number, default: 0 },
    instructor:  { type: String, required: true },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    enrolled:    { type: Number, default: 0 },
    thumbnail:   { type: String, default: '' },
    badge:       { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    tags:        [String],
    isFree:      { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now }
});

// Text index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
