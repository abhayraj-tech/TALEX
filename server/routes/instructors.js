const express = require('express');
const { getCollection } = require('../config/db');

const router = express.Router();

// GET /api/instructors — all instructors
router.get('/', (req, res) => {
  try {
    const instructors = getCollection('instructors');
    const results = instructors.find();
    res.json({ success: true, count: results.length, instructors: results });
  } catch (err) {
    console.error('[INSTRUCTORS] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching instructors' });
  }
});

// GET /api/instructors/:id — single instructor + their courses
router.get('/:id', (req, res) => {
  try {
    const instructors = getCollection('instructors');
    const instructor = instructors.findById(req.params.id);

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Get their courses
    const courses = getCollection('courses');
    const instructorCourses = courses.find({ instructorId: instructor._id });

    res.json({ success: true, instructor: { ...instructor, courses: instructorCourses } });
  } catch (err) {
    console.error('[INSTRUCTORS] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching instructor' });
  }
});

module.exports = router;
