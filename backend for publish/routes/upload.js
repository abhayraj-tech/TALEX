const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const PublishedContent = require('../models/PublishedContent');

const router = express.Router();

// ── Multer Storage Config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ── File Filter ─────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (.jpg, .png) and videos (.mp4, .mov) are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: fileFilter
});

// ── POST /api/upload ────────────────────────────────────────────────────────
// @desc    Upload an image or video
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const fileType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
        const fileUrl = `/uploads/${req.file.filename}`;

        const content = await PublishedContent.create({
            userId: req.user._id,
            title: req.body.title || 'Untitled Publication',
            fileUrl: fileUrl,
            fileType: fileType,
            filename: req.file.filename
        });

        res.status(201).json({
            message: 'Upload successful',
            content
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Server error during upload' });
    }
});

// ── GET /api/upload ─────────────────────────────────────────────────────────
// @desc    Get all published content for the current user
// @route   GET /api/upload
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const contents = await PublishedContent.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ contents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching published content' });
    }
});

module.exports = router;
