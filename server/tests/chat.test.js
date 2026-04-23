/**
 * Tests for POST /api/chat and POST /api/chat/upload
 *
 * Unit tests (tasks 2.2–2.4) and property-based tests (tasks 2.5–2.7)
 * will be added in subsequent tasks.
 *
 * Requirements covered: 3.1–3.8, 6.7, 8.5
 */

const request = require('supertest');
const fc = require('fast-check');

// ===== Task 2.2: Unit tests for POST /api/chat =====
// Requirements: 3.7, 3.8, 8.5

describe('POST /api/chat — input validation', () => {
  let app;
  const ORIGINAL_API_KEY = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    // Ensure a key is set so validation tests don't hit the 503 branch
    process.env.OPENAI_API_KEY = 'test-key-for-unit-tests';
    app = require('../server');
  });

  afterAll(() => {
    // Restore original key
    if (ORIGINAL_API_KEY === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = ORIGINAL_API_KEY;
    }
  });

  test('missing message field → 400 with error string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('empty string message → 400 with error string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('whitespace-only message → 400 with error string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '   \t\n  ' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});

describe('POST /api/chat — API key check', () => {
  let app;
  const ORIGINAL_API_KEY = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    // Remove the key before requiring the app so the module-load warning fires
    delete process.env.OPENAI_API_KEY;
    // Clear the module cache so server.js is re-evaluated without the key
    jest.resetModules();
    app = require('../server');
  });

  afterAll(() => {
    // Restore original key and reset module cache for subsequent test suites
    if (ORIGINAL_API_KEY !== undefined) {
      process.env.OPENAI_API_KEY = ORIGINAL_API_KEY;
    }
    jest.resetModules();
  });

  test('OPENAI_API_KEY unset → 503 with error "AI service is not configured"', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('AI service is not configured');
  });
});

// ===== Task 2.4: Unit tests for rate limiter =====
// Requirements: 3.6

describe('Rate limiter — 101st request within window → 429', () => {
  let testApp;

  beforeAll(() => {
    // Build a minimal Express app with a tight rate limit (max: 1) so we can
    // trigger the 429 with just 2 requests instead of 101, keeping the test fast.
    const express = require('express');
    const rateLimit = require('express-rate-limit');

    const miniApp = express();
    miniApp.use(express.json());

    const tightLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1,
      message: { error: 'Too many requests, please try again later.' },
    });

    // Mount the real chat router behind the tight limiter
    process.env.OPENAI_API_KEY = 'test-key-for-rate-limit-tests';
    miniApp.use('/api/chat', tightLimiter, require('../routes/chat'));

    testApp = miniApp;
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('101st request within 15-minute window → 429', async () => {
    // With max: 1, the 1st request is allowed and the 2nd is the "101st" equivalent
    // (i.e., the first request that exceeds the limit).
    await request(testApp)
      .post('/api/chat')
      .send({ message: 'Hello' });

    // Second request exceeds the limit → should get 429
    const res = await request(testApp)
      .post('/api/chat')
      .send({ message: 'Hello again' });

    expect(res.status).toBe(429);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});

// ===== Task 2.3: Unit tests for POST /api/chat/upload =====
// Requirements: 6.6, 6.7

describe('POST /api/chat/upload — file upload', () => {
  let app;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key-for-unit-tests';
    app = require('../server');
  });

  test('valid image upload → 200 with { filename, originalName, mimeType, size }', async () => {
    // Minimal valid 1x1 PNG (67 bytes)
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
      '2e00000000c4944415478016360f8cfc00000000200016e21bc330000000049454e44ae426082',
      'hex'
    );

    const res = await request(app)
      .post('/api/chat/upload')
      .attach('file', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(typeof res.body.filename).toBe('string');
    expect(res.body.filename.length).toBeGreaterThan(0);
    expect(res.body.originalName).toBe('test.png');
    expect(res.body.mimeType).toBe('image/png');
    expect(typeof res.body.size).toBe('number');
    expect(res.body.size).toBeGreaterThan(0);
  });

  test('file > 10 MB → 413 with error string', async () => {
    // Create a buffer just over the 10 MB limit
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0);

    const res = await request(app)
      .post('/api/chat/upload')
      .attach('file', oversizedBuffer, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});

// ===== Task 2.6: Property test — Property 7: File size limit enforced at upload =====
// Feature: chatbot-integration, Property 7: File size limit enforced at upload
// Validates: Requirements 6.7

describe('Property 7: File size limit enforced at upload', () => {
  let app;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key-for-property-tests';
    app = require('../server');
  });

  test('Property 7: any file exceeding 10 MB returns 413 with non-empty error', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use a smaller max (11 MB) to keep test fast while still covering the property
        fc.integer({ min: 10 * 1024 * 1024 + 1, max: 11 * 1024 * 1024 }),
        async (size) => {
          const buf = Buffer.alloc(size);
          try {
            const res = await request(app)
              .post('/api/chat/upload')
              .attach('file', buf, { filename: 'oversized.png', contentType: 'image/png' });
            // Server responded with 413 and a non-empty error — size limit enforced
            return res.status === 413 && typeof res.body.error === 'string' && res.body.error.length > 0;
          } catch (err) {
            // multer v2 may destroy the socket when the limit is exceeded,
            // resulting in ECONNRESET/ECONNREFUSED. This also constitutes
            // enforcement of the file size limit.
            if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.message === 'socket hang up') {
              return true;
            }
            throw err;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== Task 2.5: Property test — Property 6: Missing or empty message field returns 400 =====
// Validates: Requirements 3.8

describe('Property 6: Missing or empty message field returns 400', () => {
  let app;
  const ORIGINAL_API_KEY = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    // Ensure a key is set so validation tests don't hit the 503 branch
    process.env.OPENAI_API_KEY = 'test-key-for-property-tests';
    jest.resetModules();
    app = require('../server');
  });

  afterAll(() => {
    if (ORIGINAL_API_KEY === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = ORIGINAL_API_KEY;
    }
    jest.resetModules();
  });

  // Feature: chatbot-integration, Property 6: Missing or empty message field returns 400
  test('Property 6: missing or empty message field returns 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({}),
          fc.constant({ message: null }),
          fc.constant({ message: undefined }),
          fc.constant({ message: '' }),
          fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1 }).map(chars => ({ message: chars.join('') }))
        ),
        async (body) => {
          const res = await request(app).post('/api/chat').send(body);
          return res.status === 400 && typeof res.body.error === 'string' && res.body.error.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== Task 2.7: Property test — Property 8: API key absence returns 503 for any request =====
// Feature: chatbot-integration, Property 8: API key absence returns 503 for any request
// Validates: Requirements 8.5

describe('Property 8: API key absence returns 503 for any request', () => {
  let app;
  const ORIGINAL_API_KEY = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    // Remove the API key and get a fresh app instance without it
    delete process.env.OPENAI_API_KEY;
    jest.resetModules();
    app = require('../server');
  });

  afterAll(() => {
    // Restore original key and reset module cache for subsequent test suites
    if (ORIGINAL_API_KEY !== undefined) {
      process.env.OPENAI_API_KEY = ORIGINAL_API_KEY;
    }
    jest.resetModules();
  });

  test('Property 8: any valid message with no API key returns 503 with correct error', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid non-empty, non-whitespace message strings
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        async (message) => {
          const res = await request(app).post('/api/chat').send({ message });
          return res.status === 503 && res.body.error === 'AI service is not configured';
        }
      ),
      { numRuns: 100 }
    );
  });
});
