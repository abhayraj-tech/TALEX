const express = require('express');
const { getCollection } = require('../config/db');

const router = express.Router();

// GET /api/courses — list all or filter
router.get('/', (req, res) => {
  try {
    const courses = getCollection('courses');
    const { category, search, tag } = req.query;

    let filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    let results = courses.find(filter);

    // Search by keyword in title or description
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tag (e.g., "trending", "new", "hot")
    if (tag) {
      results = results.filter(c => c.tags && c.tags.includes(tag));
    }

    // Populate instructor names
    const instructors = getCollection('instructors');
    results = results.map(course => {
      const instructor = instructors.findById(course.instructorId);
      return {
        ...course,
        instructorName: instructor ? instructor.name : 'Unknown'
      };
    });

    res.json({ success: true, count: results.length, courses: results });
  } catch (err) {
    console.error('[COURSES] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching courses' });
  }
});

// GET /api/courses/:id — single course
router.get('/:id', (req, res) => {
  try {
    const courses = getCollection('courses');
    const course = courses.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Populate instructor
    const instructors = getCollection('instructors');
    const instructor = instructors.findById(course.instructorId);

    res.json({
      success: true,
      course: { ...course, instructor: instructor || null }
    });
  } catch (err) {
    console.error('[COURSES] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching course' });
  }
});

module.exports = router;
