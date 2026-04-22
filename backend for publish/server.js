require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const passport   = require('passport');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

// Route imports
const authRoutes     = require('./routes/auth');
const courseRoutes   = require('./routes/courses');
const badgeRoutes    = require('./routes/badges');
const userRoutes     = require('./routes/users');
const waitlistRoutes = require('./routes/waitlist');
const jobRoutes      = require('./routes/jobs');
const contactRoutes  = require('./routes/contact');
const uploadRoutes   = require('./routes/upload');

// Passport config
require('./config/passport');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:5500',   // Live Server
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Serve static frontend from project root ──────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/courses',  courseRoutes);
app.use('/api/badges',   badgeRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/jobs',     jobRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/upload',   uploadRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── SPA fallback (serve index.html for all non-API routes) ───────────────────
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    } else {
        res.status(404).json({ message: 'API route not found' });
    }
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status  = err.statusCode || 500;
    const message = err.message    || 'Internal server error';
    res.status(status).json({ message });
});

// ── Connect to MongoDB & start server ────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/talex')
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 TALEX server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        // Start server anyway so frontend is still served
        app.listen(PORT, () => {
            console.log(`⚠️  Server running WITHOUT DB on http://localhost:${PORT}`);
        });
    });

module.exports = app;
