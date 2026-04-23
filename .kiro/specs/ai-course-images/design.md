# Design Document: AI Course Images

## Overview

This document describes the technical design for integrating AI-generated images into the course cards on the TALEX dashboard. Currently, course cards in `explore_courses.html` (and the inline explore view in `dashboard.html`) use a mix of static local images from `/img` and hardcoded Unsplash URLs stored in the `image` field of each course object in `explore_backend.js`. The goal is to replace or augment these with dynamically generated images produced by an AI image generation API (OpenAI DALL-E 3), with a graceful fallback to the existing static images when the API is unavailable.

The feature introduces a lightweight server-side proxy endpoint (`/api/images/generate`) that accepts a course prompt, calls the DALL-E 3 API, and returns a URL. On the client side, `explore_backend.js` is extended with an `ImageService` that builds prompts from course metadata, calls the proxy, caches results in `sessionStorage`, and injects the AI-generated URL back into the course data before the UI renders cards. A loading skeleton is shown on each card while the image is being fetched asynchronously.

**Design Decisions:**
- **Server-side proxy over direct client calls**: The OpenAI API key must never be exposed in client-side JavaScript. All image generation requests are routed through the Express backend.
- **sessionStorage caching**: Generated image URLs are cached for the browser session so each course only triggers one API call per session. This avoids redundant costs and latency on filter/sort re-renders.
- **Non-blocking async loading**: Images are fetched after the initial card render. Cards display a CSS skeleton placeholder immediately, then swap in the AI image (or fall back to the static image) once the fetch resolves. This keeps the UI responsive.
- **Prompt determinism**: Prompts are constructed from stable course fields (title, category, tags) so the same course always produces the same prompt, making caching reliable and results reproducible.
- **DALL-E 3 at 1024x1024**: The standard square format works well with the existing card layout (`object-fit: cover` on a fixed-height container). The URL returned by DALL-E 3 is a temporary CDN link valid for 1 hour, which is sufficient for a session.

---

## Architecture

```mermaid
graph TD
    subgraph Browser["Browser (explore_courses.html / dashboard.html)"]
        EC[explore_courses.html]
        EB[explore_backend.js - DB + API + ImageService]
        EJ[explore.js - UI controller]
        EC -->|loads| EB
        EC -->|loads| EJ
        EJ -->|calls API.getCourses| EB
        EB -->|ImageService.fetchForCourse| PROXY
        EB -->|cache hit| SS[sessionStorage]
    end

    subgraph Server["Express Server (backend/server.js)"]
        PROXY[POST /api/images/generate]
        RL[Rate Limiter]
        RL --> PROXY
        PROXY -->|POST images/generations| DALLE[OpenAI DALL-E 3 API]
    end

    DALLE -->|{ url }| PROXY
    PROXY -->|{ imageUrl }| EB
    EB -->|injects imageUrl into course.aiImage| EJ
    EJ -->|renders card with aiImage or fallback| EC
```

**Data flow for a course card image:**
1. `UI.init()` in `explore.js` calls `API.getCourses()` which returns the course list from `DB.courses`
2. `UI.render(list)` renders cards immediately using the existing static `course.image` field (no delay)
3. After rendering, `UI.loadAIImages(list)` is called — it iterates each course and calls `ImageService.fetchForCourse(course)`
4. `ImageService` checks `sessionStorage` for a cached URL keyed by `course.id`; on a hit it returns immediately
5. On a miss, it POSTs `{ prompt, courseId }` to `/api/images/generate`
6. The Express route validates the request, calls DALL-E 3, and returns `{ imageUrl }`
7. The client receives the URL, stores it in `sessionStorage`, and calls `UI.swapCardImage(courseId, imageUrl)` to update the DOM
8. If any step fails, the card retains its original static image — no error is shown to the user

---

## Components and Interfaces

### Frontend Components

#### `ImageService` (added to `explore_backend.js`)

A module-level singleton object responsible for prompt construction, caching, and API calls.

```javascript
const ImageService = {
  // Build a deterministic prompt from course metadata
  buildPrompt(course),           // returns string

  // Check sessionStorage cache
  getCached(courseId),           // returns string | null

  // Store URL in sessionStorage
  setCached(courseId, url),      // returns void

  // Fetch AI image for a single course (cache-first)
  async fetchForCourse(course),  // returns string (URL or fallback)

  // Fetch AI images for all courses in parallel (bounded concurrency)
  async fetchAll(courses),       // returns Map<courseId, string>
};
```

#### `UI.loadAIImages(list)` (added to `explore.js`)

Called after `render(list)` completes. Triggers `ImageService.fetchAll(list)` and swaps card images as URLs resolve.

```javascript
// Swap the img src on a rendered card after AI image resolves
function swapCardImage(courseId, imageUrl)  // returns void

// Add/remove skeleton shimmer class on a card's image container
function setCardImageLoading(courseId, isLoading)  // returns void
```

#### CSS skeleton (added to `explore_courses.css`)

```css
.card-img.ai-loading {
  background: linear-gradient(90deg, #0f172a 25%, #1e293b 50%, #0f172a 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Backend Components

#### `backend/routes/images.js` (new file)

An Express router mounted at `/api/images` in the main server file.

**Endpoint:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/images/generate` | Generate an image via DALL-E 3 and return its URL |

**Request body:**
```javascript
{
  prompt: string,    // required, the image generation prompt
  courseId: number   // required, used for logging/rate-limiting per course
}
```

**Response (200):**
```javascript
{
  imageUrl: string   // temporary DALL-E CDN URL, valid ~1 hour
}
```

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing or empty `prompt` | `{ error: "prompt is required" }` |
| 503 | `OPENAI_API_KEY` not set | `{ error: "Image service is not configured" }` |
| 429 | Rate limit exceeded | `{ error: "Too many requests" }` |
| 500 | DALL-E API error | `{ error: "Failed to generate image" }` |

#### Rate Limiter

```javascript
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // max 20 image generations per minute per IP
  message: { error: 'Too many requests' }
});
app.use('/api/images', imageLimiter);
```

---

## Data Models

### Course object (existing, in `explore_backend.js`)

The existing `image` field is retained as the fallback. A new optional `aiImage` field is added at runtime (not persisted):

```javascript
{
  id: number,
  title: string,
  category: string,
  instructor: string,
  description: string,
  duration: string,
  lessons: number,
  rating: number,
  students: number,
  price: number,
  tags: string[],
  image: string,       // existing static fallback (local path or Unsplash URL)
  gradient: string,    // existing CSS gradient fallback
  enrolled: boolean,
  aiImage: string | null  // NEW: AI-generated URL, null until fetched
}
```

### Image Generation Request

```javascript
{
  prompt: string,    // e.g. "A vibrant digital illustration for an online course about AI & ML Fundamentals 2026, featuring neural networks and Python code, dark tech aesthetic, 16:9"
  courseId: number
}
```

### Image Generation Response

```javascript
{
  imageUrl: string   // https://oaidalleapiprodscus.blob.core.windows.net/...
}
```

### sessionStorage Cache Entry

Key: `talex_ai_img_<courseId>` (e.g. `talex_ai_img_1`)
Value: the image URL string

### Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | `server/.env` | OpenAI API key — server-side only |

---
## Key Functions with Formal Specifications

### `ImageService.buildPrompt(course)`

```javascript
function buildPrompt(course)
// Input:  course object with { title, category, tags[] }
// Output: string prompt for DALL-E 3
```

**Preconditions:**
- `course` is non-null
- `course.title` is a non-empty string
- `course.category` is a non-empty string
- `course.tags` is an array (may be empty)

**Postconditions:**
- Returns a non-empty string
- The returned string contains `course.title` as a substring
- The returned string contains `course.category` as a substring
- For any two course objects with identical `title`, `category`, and `tags`, the function returns the same string (determinism)
- No side effects

**Implementation:**
```javascript
buildPrompt(course) {
  const tagStr = course.tags.slice(0, 3).join(', ');
  return `A vibrant, professional digital illustration for an online course titled "${course.title}". ` +
         `Category: ${course.category}. Key topics: ${tagStr}. ` +
         `Dark tech aesthetic, cinematic lighting, abstract background. Square format.`;
}
```

---

### `ImageService.fetchForCourse(course)`

```javascript
async function fetchForCourse(course)
// Input:  course object
// Output: Promise<string> — AI image URL or course.image fallback
```

**Preconditions:**
- `course.id` is a positive integer
- `course.image` is a non-empty string (the fallback)

**Postconditions:**
- Always resolves (never rejects) — errors are caught internally
- If `sessionStorage` contains a cached URL for `course.id`, returns that URL without making a network request
- If the API call succeeds, the returned URL is stored in `sessionStorage` before returning
- If the API call fails for any reason, returns `course.image` (the static fallback)
- The `course.aiImage` field is set to the resolved URL before returning

**Loop Invariants:** N/A (no loops)

**Implementation:**
```javascript
async fetchForCourse(course) {
  const cached = this.getCached(course.id);
  if (cached) {
    course.aiImage = cached;
    return cached;
  }

  try {
    const res = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: this.buildPrompt(course),
        courseId: course.id
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { imageUrl } = await res.json();
    this.setCached(course.id, imageUrl);
    course.aiImage = imageUrl;
    return imageUrl;

  } catch (err) {
    console.warn(`[ImageService] Falling back to static image for course ${course.id}:`, err.message);
    course.aiImage = course.image;
    return course.image;
  }
}
```

---

### `ImageService.fetchAll(courses)`

```javascript
async function fetchAll(courses)
// Input:  array of course objects
// Output: Promise<Map<number, string>> — map of courseId -> resolved image URL
```

**Preconditions:**
- `courses` is an array (may be empty)
- Each element satisfies the preconditions of `fetchForCourse`

**Postconditions:**
- Returns a Map with exactly `courses.length` entries
- Each entry key is a `course.id` from the input array
- Each entry value is either an AI-generated URL or the course's static fallback
- Requests are issued in parallel (Promise.all) — total latency is bounded by the slowest single request, not the sum

**Loop Invariants:**
- After `Promise.all` resolves, all courses in the input array have their `aiImage` field set

**Implementation:**
```javascript
async fetchAll(courses) {
  const results = await Promise.all(
    courses.map(c => this.fetchForCourse(c).then(url => [c.id, url]))
  );
  return new Map(results);
}
```

---

### `UI.loadAIImages(list)` (in `explore.js`)

```javascript
async function loadAIImages(list)
// Input:  array of course objects (already rendered in DOM)
// Output: void — updates DOM in place as images resolve
```

**Preconditions:**
- `list` is a non-empty array of course objects
- Each course card is already rendered in the DOM with `data-course-id` attribute

**Postconditions:**
- Each card's `.card-img` element has the `ai-loading` class added before fetch starts
- After each course's image resolves, `ai-loading` is removed and the `img` src is updated
- If a course was already cached, the swap happens synchronously (no skeleton flash)

**Implementation:**
```javascript
async function loadAIImages(list) {
  // Add skeleton to all cards first
  list.forEach(c => setCardImageLoading(c.id, true));

  // Fetch all in parallel
  const urlMap = await ImageService.fetchAll(list);

  // Swap images as they resolve
  urlMap.forEach((url, courseId) => {
    swapCardImage(courseId, url);
    setCardImageLoading(courseId, false);
  });
}
```

---

### Backend: `POST /api/images/generate` handler

```javascript
async function handleImageGenerate(req, res)
// Input:  Express req with body { prompt: string, courseId: number }
// Output: JSON response { imageUrl } or error
```

**Preconditions:**
- `req.body.prompt` is a non-empty string
- `process.env.OPENAI_API_KEY` is set and non-empty

**Postconditions:**
- On success: responds with HTTP 200 and `{ imageUrl: string }` where `imageUrl` is a valid HTTPS URL
- On missing prompt: responds with HTTP 400 and `{ error: "prompt is required" }`
- On missing API key: responds with HTTP 503 and `{ error: "Image service is not configured" }`
- On DALL-E API error: responds with HTTP 500 and `{ error: "Failed to generate image" }`
- No side effects beyond the OpenAI API call

**Implementation:**
```javascript
router.post('/generate', async (req, res) => {
  const { prompt, courseId } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Image service is not configured' });
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    });

    const imageUrl = response.data[0].url;
    return res.json({ imageUrl });

  } catch (err) {
    console.error('[ImageGenerate] DALL-E error:', err.message);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
});
```

---

## Algorithmic Pseudocode

### Main Image Loading Workflow

```pascal
ALGORITHM loadAIImagesForCourseGrid(courseList)
INPUT: courseList — array of course objects already rendered in DOM
OUTPUT: void (DOM updated in place)

BEGIN
  // Phase 1: Mark all cards as loading
  FOR each course IN courseList DO
    addSkeletonClass(course.id)
  END FOR

  // Phase 2: Fetch all images in parallel
  pendingFetches ← []
  FOR each course IN courseList DO
    fetch ← ImageService.fetchForCourse(course)
    pendingFetches.add({ courseId: course.id, fetch })
  END FOR

  results ← await Promise.all(pendingFetches)

  // Phase 3: Swap images and remove skeletons
  FOR each result IN results DO
    swapCardImage(result.courseId, result.url)
    removeSkeletonClass(result.courseId)
  END FOR
END
```

**Preconditions:**
- All course cards are rendered in the DOM before this algorithm runs
- `ImageService` is initialised

**Postconditions:**
- All cards have their skeleton class removed
- All cards display either an AI-generated image or their static fallback

**Loop Invariants:**
- Phase 1: All cards processed so far have the skeleton class
- Phase 3: All cards processed so far have had their image swapped and skeleton removed

---

### Cache-First Fetch Algorithm

```pascal
ALGORITHM fetchForCourse(course)
INPUT: course — course object with id, image, title, category, tags
OUTPUT: imageUrl — string (AI URL or static fallback)

BEGIN
  // Check cache first
  cacheKey ← "talex_ai_img_" + course.id
  cached ← sessionStorage.getItem(cacheKey)

  IF cached IS NOT NULL THEN
    course.aiImage ← cached
    RETURN cached
  END IF

  // Build prompt deterministically
  prompt ← buildPrompt(course)

  // Call server proxy
  TRY
    response ← POST "/api/images/generate" WITH { prompt, courseId: course.id }

    IF response.status IS NOT 200 THEN
      THROW Error("HTTP " + response.status)
    END IF

    imageUrl ← response.body.imageUrl

    // Store in cache
    sessionStorage.setItem(cacheKey, imageUrl)
    course.aiImage ← imageUrl
    RETURN imageUrl

  CATCH error
    // Graceful fallback — never propagate
    course.aiImage ← course.image
    RETURN course.image
  END TRY
END
```

**Preconditions:**
- `course.id` is a positive integer
- `course.image` is a non-empty string

**Postconditions:**
- Always returns a non-empty string
- On success: `sessionStorage` contains the URL for future calls
- On failure: returns `course.image` unchanged

---

## Example Usage

```javascript
// In explore.js — after initial render

async function init() {
  const res = await API.getCourses();
  loading().style.display = 'none';
  if (!res.success) { showToast('Failed to load courses', true); return; }

  allCourses = res.data;
  totalCount().textContent = allCourses.length;

  // 1. Render cards immediately with static images (no delay)
  render(allCourses);

  // 2. Kick off AI image loading in the background (non-blocking)
  loadAIImages(allCourses);  // <-- NEW
}

// swapCardImage replaces the img src once AI URL is ready
function swapCardImage(courseId, imageUrl) {
  const card = document.querySelector(`[data-course-id="${courseId}"] .card-img img`);
  if (!card) return;
  const newImg = new Image();
  newImg.onload = () => { card.src = imageUrl; };
  newImg.onerror = () => { /* keep existing src */ };
  newImg.src = imageUrl;
}

// In explore_backend.js — ImageService.buildPrompt example
const prompt = ImageService.buildPrompt({
  title: 'AI & ML Fundamentals 2026',
  category: 'AI & ML',
  tags: ['Python', 'TensorFlow', 'Neural Nets']
});
// => "A vibrant, professional digital illustration for an online course titled
//    "AI & ML Fundamentals 2026". Category: AI & ML. Key topics: Python, TensorFlow, Neural Nets.
//    Dark tech aesthetic, cinematic lighting, abstract background. Square format."
```

---
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do.*

### Property 1: Prompt determinism

*For any* two course objects with identical `title`, `category`, and `tags` arrays, `ImageService.buildPrompt()` SHALL return the same string.

**Validates: Requirement — prompt construction from course metadata**

### Property 2: Cache hit avoids network request

*For any* course ID that has a cached URL in `sessionStorage`, calling `ImageService.fetchForCourse()` SHALL return the cached URL without making a network request to `/api/images/generate`.

**Validates: Requirement — image caching to avoid redundant API calls**

### Property 3: fetchForCourse always resolves

*For any* course object and any server response (including network errors, HTTP 4xx/5xx, and malformed JSON), `ImageService.fetchForCourse()` SHALL resolve (never reject) and SHALL return a non-empty string.

**Validates: Requirement — fallback to static images when AI generation fails**

### Property 4: Fallback on failure returns static image

*For any* course object where the `/api/images/generate` endpoint returns a non-200 status or throws a network error, `ImageService.fetchForCourse()` SHALL return `course.image` (the original static image path).

**Validates: Requirement — fallback to static images when AI generation fails**

### Property 5: fetchAll returns a Map with one entry per course

*For any* non-empty array of course objects, `ImageService.fetchAll()` SHALL return a Map whose size equals the length of the input array, with each course's `id` present as a key.

**Validates: Requirement — AI image generation for course cards**

### Property 6: Missing prompt returns 400

*For any* request body sent to `POST /api/images/generate` where the `prompt` field is absent, `null`, `undefined`, or a whitespace-only string, the server SHALL respond with HTTP status 400 and a JSON body containing a non-empty `error` field.

**Validates: Requirement — server-side validation**

### Property 7: Missing API key returns 503

*For any* otherwise-valid request body sent to `POST /api/images/generate` when `OPENAI_API_KEY` is not set or is an empty string, the server SHALL respond with HTTP status 503 and `{ error: "Image service is not configured" }`.

**Validates: Requirement — API key security**

### Property 8: Prompt contains course title and category

*For any* course object with a non-empty `title` and `category`, the string returned by `buildPrompt()` SHALL contain `course.title` as a substring AND `course.category` as a substring.

**Validates: Requirement — prompt construction from course metadata**

---

## Error Handling

### Client-Side Errors

| Scenario | Handling |
|----------|----------|
| Network request to `/api/images/generate` fails (fetch throws) | `fetchForCourse` catches the error, logs a warning to console, returns `course.image`. Card displays static image. |
| Server returns HTTP 4xx or 5xx | Same as above — treated as a fetch failure, falls back to static image. |
| Malformed JSON in response | `res.json()` throws, caught by try/catch, falls back to static image. |
| `sessionStorage` quota exceeded | `setCached` call throws; caught silently — image still displays, just not cached. |
| Card DOM element not found in `swapCardImage` | Early return — no error thrown, no visual change. |
| All courses fail AI generation | All cards display their original static images — no degradation in UX. |

### Server-Side Errors

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Missing or empty `prompt` | 400 | `{ "error": "prompt is required" }` |
| `OPENAI_API_KEY` not set | 503 | `{ "error": "Image service is not configured" }` |
| DALL-E API error (any) | 500 | `{ "error": "Failed to generate image" }` |
| Rate limit exceeded | 429 | `{ "error": "Too many requests" }` |

### Startup Warning

When the server starts and `OPENAI_API_KEY` is not set, it logs:
```
⚠️  WARNING: OPENAI_API_KEY is not set. Image generation endpoint will return 503.
```
The server continues to start normally.

---

## Testing Strategy

### Unit Tests

**Frontend (using jsdom or browser test runner):**
- `buildPrompt({ title: 'X', category: 'Y', tags: ['A','B'] })` returns a string containing 'X' and 'Y'
- `buildPrompt` called twice with identical inputs returns identical strings
- `fetchForCourse` with a cached sessionStorage entry returns the cached URL without calling `fetch`
- `fetchForCourse` when `fetch` throws returns `course.image`
- `fetchForCourse` when server returns 500 returns `course.image`
- `fetchAll([])` returns an empty Map
- `fetchAll([c1, c2])` returns a Map with 2 entries

**Backend (using Jest + supertest):**
- `POST /api/images/generate` with missing `prompt` → 400
- `POST /api/images/generate` with empty string `prompt` → 400
- `POST /api/images/generate` with whitespace-only `prompt` → 400
- `POST /api/images/generate` when `OPENAI_API_KEY` is unset → 503
- `POST /api/images/generate` with valid prompt (mocked DALL-E) → 200 with `imageUrl`
- Rate limiter: 21st request within 1 minute → 429

### Property-Based Tests

Property-based tests use **fast-check** to verify universal properties across many generated inputs. Each test runs a minimum of **100 iterations**.

```javascript
// Feature: ai-course-images, Property 1: Prompt determinism
// For any two identical course objects, buildPrompt returns the same string
fc.assert(fc.property(
  fc.record({ title: fc.string({ minLength: 1 }), category: fc.string({ minLength: 1 }), tags: fc.array(fc.string()) }),
  (course) => {
    const p1 = ImageService.buildPrompt(course);
    const p2 = ImageService.buildPrompt({ ...course });
    return p1 === p2;
  }
), { numRuns: 100 });

// Feature: ai-course-images, Property 3: fetchForCourse always resolves
// For any course, fetchForCourse never rejects regardless of server response
fc.assert(fc.property(
  fc.record({ id: fc.integer({ min: 1 }), image: fc.string({ minLength: 1 }), title: fc.string({ minLength: 1 }), category: fc.string({ minLength: 1 }), tags: fc.array(fc.string()) }),
  async (course) => {
    // Mock fetch to throw
    global.fetch = () => Promise.reject(new Error('Network error'));
    const result = await ImageService.fetchForCourse(course);
    return typeof result === 'string' && result.length > 0;
  }
), { numRuns: 100 });

// Feature: ai-course-images, Property 5: fetchAll returns Map with one entry per course
// For any array of courses, fetchAll returns a Map of the same length
fc.assert(fc.property(
  fc.array(fc.record({ id: fc.integer({ min: 1 }), image: fc.string({ minLength: 1 }), title: fc.string({ minLength: 1 }), category: fc.string({ minLength: 1 }), tags: fc.array(fc.string()) }), { minLength: 1, maxLength: 10 }),
  async (courses) => {
    global.fetch = () => Promise.reject(new Error('Network error'));
    const map = await ImageService.fetchAll(courses);
    return map.size === courses.length && courses.every(c => map.has(c.id));
  }
), { numRuns: 100 });

// Feature: ai-course-images, Property 6: Missing prompt returns 400
// For any request body without a valid prompt, server returns 400
fc.assert(fc.property(
  fc.oneof(fc.constant({}), fc.constant({ prompt: '' }), fc.constant({ prompt: '   ' }), fc.constant({ prompt: null })),
  async (body) => {
    const res = await request(app).post('/api/images/generate').send(body);
    return res.status === 400 && typeof res.body.error === 'string';
  }
), { numRuns: 100 });

// Feature: ai-course-images, Property 8: Prompt contains course title and category
// For any course with non-empty title and category, prompt contains both
fc.assert(fc.property(
  fc.record({ title: fc.string({ minLength: 1 }), category: fc.string({ minLength: 1 }), tags: fc.array(fc.string()) }),
  (course) => {
    const prompt = ImageService.buildPrompt(course);
    return prompt.includes(course.title) && prompt.includes(course.category);
  }
), { numRuns: 100 });
```

### Integration Tests

- Full round-trip: POST `/api/images/generate` with mocked OpenAI → verify `imageUrl` is a string starting with `https://`
- Cache integration: call `fetchForCourse` twice for the same course → verify `fetch` is only called once (second call uses sessionStorage)
- Fallback integration: POST `/api/images/generate` returns 500 → verify card still displays static image after `loadAIImages` completes

### Manual / Exploratory Tests

- Load the courses page with a valid `OPENAI_API_KEY` — verify cards show skeleton shimmer then swap to AI images
- Load the courses page without `OPENAI_API_KEY` — verify all cards display static images with no errors in the UI
- Reload the page — verify AI images load faster on second load (sessionStorage cache hit)
- Apply a filter (e.g. "AI & ML") — verify filtered cards show AI images (cached) without re-fetching
- Throttle network to "Slow 3G" in DevTools — verify skeleton shimmer is visible for several seconds before images appear

---

## Performance Considerations

- **Parallel fetching**: All course images are fetched concurrently via `Promise.all`, so total load time equals the slowest single request (~2-4 seconds for DALL-E 3), not the sum.
- **sessionStorage caching**: Eliminates redundant API calls on filter/sort re-renders within the same session. Each course generates at most one image per session.
- **Non-blocking render**: The initial card render uses static images immediately. AI images are loaded asynchronously and swapped in — the page is interactive from the first render.
- **Rate limiting**: The server enforces 20 requests/minute per IP to prevent runaway costs from rapid filter changes or automated requests.
- **Image size**: DALL-E 3 at `1024x1024` produces ~1-2 MB images. The browser caches these via HTTP cache headers on the CDN URL, so subsequent renders of the same URL are instant.

---

## Security Considerations

- **API key isolation**: `OPENAI_API_KEY` is only read in `backend/routes/images.js` on the server. It is never sent to the client, never logged, and never included in any response body.
- **Prompt injection**: User-controlled data (course title, tags) is interpolated into the prompt string. Since the prompt is only used for image generation (not code execution or SQL), the risk is limited to generating off-topic images. The prompt template wraps user data in quotes and provides strong context to constrain the output.
- **Rate limiting**: Prevents abuse of the image generation endpoint, which has a direct cost per call.
- **Input validation**: The server validates that `prompt` is a non-empty, non-whitespace string before calling the OpenAI API.

---

## Dependencies

| Dependency | Location | Purpose |
|------------|----------|---------|
| `openai` npm package | `backend/` | Official OpenAI Node.js SDK for DALL-E 3 API calls |
| `express-rate-limit` npm package | `backend/` | Rate limiting middleware for `/api/images` |
| `fast-check` npm package (dev) | `backend/` | Property-based testing library |
| `sessionStorage` (browser built-in) | Client | Caching AI image URLs for the session |
| `fetch` (browser built-in) | Client | HTTP requests from `ImageService` to the proxy endpoint |
