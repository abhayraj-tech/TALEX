const express = require('express');
const { body, validationResult } = require('express-validator');
const Job     = require('../models/Job');
const User    = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/jobs ────────────────────────────────────────────────────────────
// Query: badges (comma-separated), skills, location, type, search, page, limit
router.get('/', async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip  = (page - 1) * limit;

        const filter = { isActive: true };

        if (req.query.badges) {
            const badgeList = req.query.badges.split(',').map(b => b.trim());
            filter.requiredBadges = { $in: badgeList };
        }
        if (req.query.location) filter.location = new RegExp(req.query.location, 'i');
        if (req.query.type)     filter.type      = req.query.type;
        if (req.query.search)   filter.$text     = { $search: req.query.search };

        const [jobs, total] = await Promise.all([
            Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Job.countDocuments(filter)
        ]);

        res.json({ jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching jobs.' });
    }
});

// ── POST /api/jobs ───────────────────────────────────────────────────────────
router.post('/', protect, [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const job = await Job.create({ ...req.body, postedBy: req.user._id });
        res.status(201).json({ job });
    } catch (err) {
        res.status(500).json({ message: 'Error creating job.' });
    }
});

// ── POST /api/hiring/match ───────────────────────────────────────────────────
// AI-style matching: find jobs that match user's badges and skills
router.post('/match', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('badges', 'name')
            .select('badges skills coursesCompleted');

        const userBadgeNames = user.badges.map(b => b.name);
        const userSkills     = user.skills || [];

        // Score jobs by overlap
        const jobs = await Job.find({ isActive: true });

        const scored = jobs.map(job => {
            const badgeOverlap = job.requiredBadges.filter(b =>
                userBadgeNames.includes(b)
            ).length;
            const skillOverlap = job.requiredSkills.filter(s =>
                userSkills.map(u => u.toLowerCase()).includes(s.toLowerCase())
            ).length;

            const score = (badgeOverlap * 3) + (skillOverlap * 2);
            return { ...job.toObject(), matchScore: score };
        });

        const matched = scored
            .filter(j => j.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10);

        res.json({ matches: matched });
    } catch (err) {
        res.status(500).json({ message: 'Error running match.' });
    }
});

// ── GET /api/candidates ──────────────────────────────────────────────────────
router.get('/candidates', protect, async (req, res) => {
    try {
        const filter = {};
        if (req.query.badges) {
            // Find users who have badges with these names
            const Badge = require('../models/Badge');
            const badgeNames = req.query.badges.split(',').map(b => b.trim());
            const badges = await Badge.find({ name: { $in: badgeNames } }).select('_id');
            const badgeIds = badges.map(b => b._id);
            filter.badges = { $in: badgeIds };
        }
        if (req.query.skills) {
            const skills = req.query.skills.split(',').map(s => s.trim());
            filter.skills = { $in: skills };
        }

        const candidates = await User.find(filter)
            .select('name avatar skills badges credits')
            .populate('badges', 'name icon tier')
            .limit(50);

        res.json({ candidates });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching candidates.' });
    }
});

module.exports = router;
