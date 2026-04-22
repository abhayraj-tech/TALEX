const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes – verifies JWT and attaches req.user
 */
async function protect(req, res, next) {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User no longer exists.' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

/**
 * Restrict to specific roles
 */
function restrictTo(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission.' });
        }
        next();
    };
}

/**
 * Generate a signed JWT
 */
function signToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

module.exports = { protect, restrictTo, signToken };
