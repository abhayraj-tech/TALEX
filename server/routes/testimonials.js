const express = require('express');
const { getCollection } = require('../config/db');

const router = express.Router();

// GET /api/testimonials
router.get('/', (req, res) => {
  try {
    const testimonials = getCollection('testimonials');
    const results = testimonials.find();
    res.json({ success: true, count: results.length, testimonials: results });
  } catch (err) {
    console.error('[TESTIMONIALS] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching testimonials' });
  }
});

module.exports = router;
