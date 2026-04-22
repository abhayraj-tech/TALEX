const express = require('express');
const Course  = require('../models/Course');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/courses ─────────────────────────────────────────────────────────
// Query params: page, limit, category, difficulty, free, search, sort
router.get('/', async (req, res) => {
    try {
        const page       = Math.max(1, parseInt(req.query.page)  || 1);
        const limit      = Math.min(50, parseInt(req.query.limit) || 12);
        const skip       = (page - 1) * limit;

        const filter = {};

        if (req.query.category)   filter.category   = req.query.category;
        if (req.query.difficulty) filter.difficulty  = req.query.difficulty;
        if (req.query.free === 'true')  filter.isFree = true;
        if (req.query.free === 'false') filter.isFree = false;

        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        // Sort options
        const sortMap = {
            popularity: { enrolled: -1 },
            newest:     { createdAt: -1 },
            rating:     { rating: -1 },
            price_asc:  { creditCost: 1 },
            price_desc: { creditCost: -1 }
        };
        const sort = sortMap[req.query.sort] || { createdAt: -1 };

        const [courses, total] = await Promise.all([
            Course.find(filter).sort(sort).skip(skip).limit(limit).populate('badge', 'name icon tier'),
            Course.countDocuments(filter)
        ]);

        res.json({
            courses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching courses.' });
    }
});

// ── GET /api/courses/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('badge');
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        res.json({ course });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching course.' });
    }
});

module.exports = router;
