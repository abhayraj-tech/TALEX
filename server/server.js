require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static frontend files (parent directory)
app.use(express.static(path.join(__dirname, '..')));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enroll', require('./routes/enroll'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/testimonials', require('./routes/testimonials'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TALEX API is running 🚀', timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'new.html'));
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║     🚀 TALEX API Server Running      ║');
  console.log(`  ║     http://localhost:${PORT}             ║`);
  console.log('  ║                                      ║');
  console.log('  ║  Frontend: http://localhost:' + PORT + '/new.html');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
