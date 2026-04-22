const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// ── GET /api/user/credits ────────────────────────────────────────────────────
router.get('/credits', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('credits creditTransactions');
        res.json({
            credits:      user.credits,
            transactions: user.creditTransactions.slice(-50).reverse() // last 50
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching credits.' });
    }
});

// ── GET /api/user/badges ─────────────────────────────────────────────────────
router.get('/badges', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('badges')
            .populate('badges', 'name icon description tier');
        res.json({ badges: user.badges });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user badges.' });
    }
});

// ── GET /api/user/courses ────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('coursesEnrolled coursesCompleted')
            .populate('coursesEnrolled',  'title thumbnail category difficulty')
            .populate('coursesCompleted', 'title thumbnail category difficulty');
        res.json({
            enrolled:  user.coursesEnrolled,
            completed: user.coursesCompleted
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user courses.' });
    }
});

// ── GET /api/user/profile ────────────────────────────────────────────────────
router.get('/profile', (req, res) => {
    res.json({ user: req.user });
});

// ── PATCH /api/user/profile ──────────────────────────────────────────────────
router.patch('/profile', async (req, res) => {
    const allowed = ['name', 'bio', 'skills', 'avatar'];
    const updates = {};
    allowed.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    try {
        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true, runValidators: true
        });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile.' });
    }
});

module.exports = router;
