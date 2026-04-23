const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Set this in .env
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'gpt-4o-mini' } = req.body;
    
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are TALEX, a helpful AI assistant. Be concise, friendly, and helpful."
        },
        { role: "user", content: message }
      ],
      stream: true,
      temperature: 0.7
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
  res.json({ 
    files: req.files?.map(file => ({
      name: file.originalname,
      path: `/uploads/${file.filename}`
    })) 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 TALEX AI Bot running on port ${PORT}`);
});