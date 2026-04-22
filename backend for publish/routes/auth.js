const express  = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { protect, signToken } = require('../middleware/auth');
const { sendEmail, welcomeEmail } = require('../config/email');

const router = express.Router();

// Helper: send token response
function sendToken(user, statusCode, res) {
    const token = signToken(user._id);
    res.status(statusCode).json({
        token,
        user: {
            id:      user._id,
            name:    user.name,
            email:   user.email,
            avatar:  user.avatar,
            credits: user.credits,
            role:    user.role
        }
    });
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((val, { req }) => {
        if (val !== req.body.password) throw new Error('Passwords do not match');
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const user = await User.create({ name, email, password, credits: 100 });

        // Send welcome email (non-blocking)
        const { subject, html } = welcomeEmail(name);
        sendEmail({ to: email, subject, html }).catch(console.error);

        sendToken(user, 201, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        sendToken(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    // JWT is stateless; client should discard the token
    res.json({ message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
    res.json({ user: req.user });
});

// ── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => {
        const token = signToken(req.user._id);
        res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?token=${token}`);
    }
);

// ── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login?error=github' }),
    (req, res) => {
        const token = signToken(req.user._id);
        res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?token=${token}`);
    }
);

module.exports = router;
