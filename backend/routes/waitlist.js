const express  = require('express');
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const { sendEmail, waitlistConfirmEmail } = require('../config/email');

const router = express.Router();

// ── POST /api/waitlist ───────────────────────────────────────────────────────
router.post('/', [
    body('email')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, source } = req.body;

    try {
        const existing = await Waitlist.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "You're already on the list!" });
        }

        await Waitlist.create({ email, source: source || 'landing-page' });

        // Send confirmation email (non-blocking)
        const { subject, html } = waitlistConfirmEmail(email);
        sendEmail({ to: email, subject, html }).catch(console.error);

        res.status(201).json({ message: 'Thanks for joining! Check your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

module.exports = router;
