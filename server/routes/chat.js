const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// ===== API KEY CHECK AT MODULE LOAD =====
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set. Chat endpoint will return 503.');
}

// ===== MULTER SETUP FOR FILE UPLOADS =====
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ===== POST / — Stream chat completion via Gemini =====
router.post('/', async (req, res) => {
  const { message } = req.body;

  // Validate message field
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message field is required' });
  }

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try models in order until one works
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `You are TALEX AI, a helpful learning assistant for the TALEX skill-learning platform.\n\nUser: ${message.trim()}\n\nAssistant:`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Send as SSE chunks (simulate streaming by splitting into sentences)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        for (const sentence of sentences) {
          res.write(`data: ${JSON.stringify({ content: sentence + ' ' })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError;
  } catch (err) {
    console.error('Gemini error:', err.message);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }
});

// ===== POST /upload — Accept multipart file upload =====
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File exceeds maximum size of 10 MB' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    return res.status(200).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  });
});

module.exports = router;
