const express = require('express');
const { getCollection } = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/enroll — enroll in a course (protected)
router.post('/', protect, (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Please provide a courseId' });
    }

    const courses = getCollection('courses');
    const course = courses.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const users = getCollection('users');
    const user = users.findById(req.user._id);

    // Check for duplicate enrollment
    if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    // Check if user has enough credits
    const courseCost = course.credits || 0;
    if (user.credits < courseCost) {
      return res.status(400).json({ success: false, message: `Not enough credits. This course costs ${courseCost} credits.` });
    }

    // Enroll user
    const enrolledCourses = [...(user.enrolledCourses || []), courseId];
    const newCredits = user.credits - courseCost;

    users.updateById(user._id, { enrolledCourses, credits: newCredits });

    res.json({
      success: true,
      message: `Successfully enrolled in "${course.title}"!`,
      remainingCredits: newCredits,
      enrolledCourses
    });
  } catch (err) {
    console.error('[ENROLL] Error:', err);
    res.status(500).json({ success: false, message: 'Server error during enrollment' });
  }
});

// GET /api/my-courses — get enrolled courses (protected)
router.get('/my-courses', protect, (req, res) => {
  try {
    const users = getCollection('users');
    const user = users.findById(req.user._id);
    const courses = getCollection('courses');
    const instructors = getCollection('instructors');

    const enrolledCourses = courses.findByIds(user.enrolledCourses || []).map(course => {
      const instructor = instructors.findById(course.instructorId);
      return { ...course, instructorName: instructor ? instructor.name : 'Unknown' };
    });

    res.json({ success: true, count: enrolledCourses.length, courses: enrolledCourses });
  } catch (err) {
    console.error('[ENROLL] Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching enrolled courses' });
  }
});

module.exports = router;
