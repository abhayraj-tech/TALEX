const express = require('express');
const Badge   = require('../models/Badge');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/badges ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.tier)     filter.tier     = req.query.tier;
        if (req.query.category) filter.category = req.query.category;

        const badges = await Badge.find(filter).sort({ tier: 1, name: 1 });
        res.json({ badges });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching badges.' });
    }
});

// ── GET /api/badges/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) return res.status(404).json({ message: 'Badge not found.' });
        res.json({ badge });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching badge.' });
    }
});

module.exports = router;
