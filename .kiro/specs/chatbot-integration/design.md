# Design Document: Chatbot Integration

## Overview

This document describes the technical design for integrating an AI-powered chatbot assistant ("TALEX AI") into the TALEX platform dashboard. The integration adapts the existing React/TypeScript chatbot reference assets into a vanilla JavaScript floating widget, and merges the chatbot backend into the existing Express server at `server/server.js`.

The chatbot provides students with contextual learning support, course guidance, and general Q&A directly from the dashboard without navigating away. Key capabilities include real-time streaming responses via SSE, voice input via the Web Speech API, file/image attachment, and message management actions.

**Design Decisions:**
- **Vanilla JS over React**: The existing frontend is plain HTML/CSS/JS with no build pipeline. Introducing React would require Vite/webpack, TypeScript compilation, and a separate build step — disproportionate overhead for a single widget. Vanilla JS keeps the integration seamless.
- **Merged backend**: Running a second Express process adds operational complexity (port management, CORS, process supervision). Merging into `server/server.js` keeps the platform as a single deployable unit.
- **SSE over WebSockets**: SSE is unidirectional (server → client), which is exactly what streaming AI responses require. It works over standard HTTP, requires no additional libraries, and is natively supported by `EventSource` in all modern browsers.
- **Session-only memory**: Message history lives in JavaScript memory for the current page session. This avoids database schema changes and keeps the feature self-contained. History is lost on page refresh, which is acceptable for a learning assistant.

---

## Architecture

```mermaid
graph TD
    subgraph Browser
        DH[dashboard.html]
        CW[chatbot-widget.js]
        CS[chatbot-widget.css]
        DH -->|loads| CW
        DH -->|loads| CS
        CW -->|POST /api/chat| BE
        CW -->|POST /api/chat/upload| BE
        CW -->|Web Speech API| MIC[Microphone]
    end

    subgraph Server [server/server.js - Express]
        BE[/api/chat route]
        UE[/api/chat/upload route]
        RL[Rate Limiter middleware]
        RL --> BE
        RL --> UE
        BE -->|stream| OAI[OpenAI API]
        UE -->|store| UD[uploads/ directory]
    end

    OAI -->|SSE tokens| BE
    BE -->|text/event-stream| CW
```

**Data flow for a chat message:**
1. User types a message and submits (Enter or send button)
2. `chatbot-widget.js` appends the user message to the in-memory history and renders it
3. A `POST /api/chat` request is sent with `{ message, history }` as JSON
4. The Express route validates the request, checks `OPENAI_API_KEY`, applies rate limiting, then opens an OpenAI streaming completion
5. Each token chunk is forwarded to the client as an SSE `data:` event
6. The widget reads the `EventSource`-style stream via `fetch` + `ReadableStream`, appending each token to the assistant message bubble
7. On `[DONE]`, the stream closes, the input is re-enabled, and the message is marked complete

---

## Components and Interfaces

### Frontend Components

#### `chatbot-widget.js`
A single self-contained vanilla JS module that initialises when `dashboard.html` loads. It creates all DOM elements programmatically and attaches event listeners.

**Public API (module-level functions):**
```javascript
// Initialise and mount the widget into document.body
function initChatWidget()

// Toggle panel open/closed
function toggleChatPanel()

// Send the current input as a message
async function sendMessage()

// Start/stop voice recognition
function toggleVoiceInput()

// Clear all messages and show welcome state
function clearChat()

// Copy text to clipboard and show toast
async function copyToClipboard(text)
```

**Internal state (module-scoped variables):**
```javascript
let isPanelOpen = false;
let isStreaming = false;
let messages = [];          // Array<{ role, content, id, timestamp }>
let recognition = null;     // SpeechRecognition instance or null
let isRecording = false;
let pendingFile = null;     // { file: File, previewUrl: string } | null
```

#### `chatbot-widget.css`
Scoped CSS for the widget. All selectors are prefixed with `.talex-chat-` to avoid collisions with existing dashboard styles. Uses CSS custom properties that inherit from the dashboard's existing design tokens (`--cyan`, `--bg-surface`, `--border`, `--text`, `--muted`).

### Backend Components

#### `server/routes/chat.js` (new file)
An Express router module that is `require()`-d into `server/server.js`. Keeps the chat logic isolated and the main server file clean.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Stream a chat completion from OpenAI |
| `POST` | `/api/chat/upload` | Accept a multipart file upload |

#### Rate Limiter (applied in `server/server.js`)
```javascript
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/chat', chatLimiter);
```

### SSE Protocol

The `/api/chat` endpoint uses the following SSE format:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content":"Hello"}\n\n
data: {"content":", how"}\n\n
data: {"content":" can I help?"}\n\n
data: [DONE]\n\n
```

The client reads this via `fetch` + `response.body.getReader()` (same pattern as the reference React component), parsing each `data:` line and accumulating content into the assistant message bubble.

---

## Data Models

### Message (client-side, in-memory)
```javascript
{
  id: string,           // "user-<timestamp>" or "assistant-<timestamp>"
  role: "user" | "assistant",
  content: string,      // full text content
  timestamp: Date,
  isStreaming: boolean, // true while SSE stream is active
  fileRef: {            // optional, present when a file was attached
    name: string,
    previewUrl: string  // object URL for images, null for documents
  } | null
}
```

### Chat Request (POST /api/chat body)
```javascript
{
  message: string,      // required, the user's text input
  model: string         // optional, defaults to "gpt-4o-mini"
}
```

### Chat Response (SSE stream)
Each event:
```javascript
{ content: string }     // partial token
```
Terminal event:
```
[DONE]
```
Error response (non-streaming, HTTP 4xx/5xx):
```javascript
{ error: string }
```

### Upload Request (POST /api/chat/upload)
- `Content-Type: multipart/form-data`
- Field name: `file` (single file)
- Accepted MIME types: `image/png`, `image/jpeg`, `image/gif`, `application/pdf`, `text/plain`
- Max size: 10 MB (enforced by multer `limits.fileSize`)

### Upload Response
```javascript
{
  filename: string,     // stored filename in uploads/
  originalName: string,
  mimeType: string,
  size: number          // bytes
}
```

### Environment Variables
| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | `server/.env` | OpenAI API key — server-side only, never sent to client |

---

## DOM Structure

The widget injects the following HTML structure into `document.body`:

```html
<!-- Floating action button -->
<button id="talex-chat-toggle" class="talex-chat-toggle" aria-label="Open TALEX AI chat">
  <span class="talex-chat-icon-bot">🤖</span>
  <span class="talex-chat-icon-close" hidden>✕</span>
</button>

<!-- Chat panel -->
<div id="talex-chat-panel" class="talex-chat-panel" aria-hidden="true" role="dialog"
     aria-label="TALEX AI Chat">
  <!-- Header -->
  <div class="talex-chat-header">
    <div class="talex-chat-header-info">
      <span class="talex-chat-avatar">🤖</span>
      <div>
        <h3>TALEX AI</h3>
        <span class="talex-chat-status">Online</span>
      </div>
    </div>
    <button class="talex-chat-clear" aria-label="Clear chat history">🗑</button>
  </div>

  <!-- Messages -->
  <div id="talex-chat-messages" class="talex-chat-messages" role="log"
       aria-live="polite" aria-label="Chat messages"></div>

  <!-- File preview strip (shown when file is pending) -->
  <div id="talex-chat-file-preview" class="talex-chat-file-preview" hidden></div>

  <!-- Input area -->
  <div class="talex-chat-input-area">
    <button class="talex-chat-attach" aria-label="Attach file">📎</button>
    <input type="file" id="talex-chat-file-input" accept="image/png,image/jpeg,image/gif,application/pdf,text/plain" hidden>
    <button class="talex-chat-mic" aria-label="Start voice input">🎤</button>
    <input type="text" id="talex-chat-input" class="talex-chat-text-input"
           placeholder="Ask TALEX AI anything..." aria-label="Chat message input">
    <button id="talex-chat-send" class="talex-chat-send" aria-label="Send message">➤</button>
  </div>
</div>
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message submission grows history

*For any* non-empty message string and any existing message history, submitting that message SHALL result in the history containing exactly one more entry than before, with the new entry having `role: "user"` and `content` equal to the submitted text (trimmed).

**Validates: Requirements 2.3**

### Property 2: Whitespace-only input is rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to submit it as a chat message SHALL leave the message history unchanged and SHALL NOT trigger a network request to `/api/chat`.

**Validates: Requirements 2.3**

### Property 3: SSE token accumulation is monotonically growing

*For any* ordered sequence of token strings arriving from the SSE stream, the displayed content of the assistant message bubble after receiving N tokens SHALL be the concatenation of the first N tokens — tokens are only appended, never replaced or reordered.

**Validates: Requirements 2.5, 4.1**

### Property 4: Control disabled state always matches streaming state

*For any* streaming state (active or inactive), the send button's `disabled` attribute and the text input's `disabled` attribute SHALL both be `true` when streaming is active and `false` when streaming is inactive — the transition happens atomically when the stream starts and when it terminates (either `[DONE]` or an error).

**Validates: Requirements 4.3, 4.4**

### Property 5: Clear chat resets to empty state

*For any* message history of any length (including zero), invoking `clearChat()` SHALL result in the message history containing exactly zero entries and the welcome message element being visible.

**Validates: Requirements 7.4**

### Property 6: Missing or empty message field returns 400

*For any* request body sent to `POST /api/chat` where the `message` field is absent, `null`, `undefined`, or an empty/whitespace-only string, the server SHALL respond with HTTP status 400 and a JSON body containing a non-empty `error` field.

**Validates: Requirements 3.8**

### Property 7: File size limit enforced at upload

*For any* file whose byte size exceeds 10,485,760 bytes (10 MB), a `POST /api/chat/upload` request SHALL receive HTTP status 413 and a JSON body containing a non-empty `error` field, regardless of the file's MIME type or name.

**Validates: Requirements 6.7**

### Property 8: API key absence returns 503 for any request

*For any* otherwise-valid request body sent to `POST /api/chat` when the `OPENAI_API_KEY` environment variable is not set or is an empty string, the server SHALL respond with HTTP status 503 and a JSON body with `error: "AI service is not configured"`.

**Validates: Requirements 8.5**

### Property 9: All interactive widget controls have aria-labels

*For any* interactive element (buttons and inputs) rendered within the chat widget DOM, the element SHALL have an `aria-label` attribute that is present and non-empty.

**Validates: Requirements 9.3**

### Property 10: File attachment is reflected in message history

*For any* file object attached before submission, the resulting message history entry SHALL contain a `fileRef` object with a `name` property equal to the file's original name.

**Validates: Requirements 6.5**

---

## Error Handling

### Client-Side Errors

| Scenario | Handling |
|----------|----------|
| Network request fails (fetch throws) | Display inline error bubble in chat: "Connection error. Please try again." Re-enable input. |
| SSE stream interrupted before `[DONE]` | Display inline error in the streaming bubble: "Response interrupted. Please try again." Re-enable input. |
| HTTP 429 (rate limit) | Display inline error: "Too many requests. Please wait a moment." Re-enable input. |
| HTTP 503 (AI not configured) | Display inline error: "AI service is temporarily unavailable." Re-enable input. |
| HTTP 413 (file too large) | Display toast: "File exceeds 10 MB limit." Clear pending file. |
| HTTP 400 (bad request) | Display inline error with server's `error` message. Re-enable input. |
| Web Speech API not supported | Hide microphone button silently (no error shown). |
| Clipboard API not available | Show toast: "Copy not supported in this browser." |

### Server-Side Errors

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Missing `message` field | 400 | `{ "error": "message field is required" }` |
| `OPENAI_API_KEY` not set | 503 | `{ "error": "AI service is not configured" }` |
| OpenAI API error (any) | 500 | `{ "error": "Failed to generate response" }` |
| File exceeds 10 MB | 413 | `{ "error": "File exceeds maximum size of 10 MB" }` |
| Rate limit exceeded | 429 | `{ "error": "Too many requests, please try again later." }` |

### Startup Warning
When `server/server.js` starts and `OPENAI_API_KEY` is not set, the server logs:
```
⚠️  WARNING: OPENAI_API_KEY is not set. Chat endpoint will return 503.
```
The server continues to start normally — the missing key only affects the `/api/chat` endpoint.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure logic functions. They live in `server/tests/chat.test.js` (backend) and can be run with the existing Node.js test setup.

**Backend unit tests:**
- `POST /api/chat` with missing `message` → 400
- `POST /api/chat` with empty string `message` → 400
- `POST /api/chat` when `OPENAI_API_KEY` is unset → 503
- `POST /api/chat/upload` with file > 10 MB → 413
- `POST /api/chat/upload` with valid image → 200 with filename
- Rate limiter: 101st request within window → 429

**Frontend unit tests (using jsdom or similar):**
- `clearChat()` resets `messages` array to `[]`
- `toggleChatPanel()` toggles `isPanelOpen` and updates `aria-hidden`
- Submitting whitespace-only input does not call `fetch`
- Microphone button is hidden when `window.SpeechRecognition` is undefined

### Property-Based Tests

Property-based tests use **fast-check** (JavaScript PBT library) to verify universal properties across many generated inputs. Each test runs a minimum of **100 iterations**.

Install: `npm install --save-dev fast-check` in `server/`.

**Property tests:**

```javascript
// Feature: chatbot-integration, Property 1: Message submission grows history
// For any non-empty message string, submitting it grows the history by exactly 1
fc.assert(fc.property(fc.string({ minLength: 1 }), (msg) => {
  const before = messages.length;
  submitMessage(msg);
  return messages.length === before + 1 && messages.at(-1).role === 'user';
}), { numRuns: 100 });

// Feature: chatbot-integration, Property 2: Whitespace-only input is rejected
// For any whitespace-only string, submission leaves history unchanged
fc.assert(fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1 }), (ws) => {
  const before = messages.length;
  submitMessage(ws);
  return messages.length === before;
}), { numRuns: 100 });

// Feature: chatbot-integration, Property 3: SSE token accumulation is monotonically growing
// For any sequence of token strings, accumulated content equals their concatenation
fc.assert(fc.property(fc.array(fc.string(), { minLength: 1 }), (tokens) => {
  let accumulated = '';
  tokens.forEach(token => { accumulated += token; });
  return simulateTokenStream(tokens) === accumulated;
}), { numRuns: 100 });

// Feature: chatbot-integration, Property 6: Missing or empty message field returns 400
// For any request body without a valid message, server returns 400
fc.assert(fc.property(
  fc.oneof(fc.constant({}), fc.constant({ message: '' }), fc.constant({ message: '   ' })),
  async (body) => {
    const res = await request(app).post('/api/chat').send(body);
    return res.status === 400 && typeof res.body.error === 'string';
  }
), { numRuns: 100 });

// Feature: chatbot-integration, Property 7: File size limit enforced at upload
// For any file size > 10MB, upload returns 413
fc.assert(fc.property(
  fc.integer({ min: 10 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 }),
  async (size) => {
    const res = await uploadFileOfSize(size);
    return res.status === 413 && typeof res.body.error === 'string';
  }
), { numRuns: 100 });

// Feature: chatbot-integration, Property 8: API key absence returns 503 for any request
// For any valid request body, missing API key always returns 503
fc.assert(fc.property(fc.string({ minLength: 1 }), async (msg) => {
  delete process.env.OPENAI_API_KEY;
  const res = await request(app).post('/api/chat').send({ message: msg });
  return res.status === 503 && res.body.error === 'AI service is not configured';
}), { numRuns: 100 });

// Feature: chatbot-integration, Property 9: All interactive widget controls have aria-labels
// For every button and input in the widget, aria-label is present and non-empty
fc.assert(fc.property(fc.constant(null), () => {
  const controls = document.querySelectorAll('#talex-chat-panel button, #talex-chat-panel input, #talex-chat-toggle');
  return Array.from(controls).every(el => el.getAttribute('aria-label')?.trim().length > 0);
}), { numRuns: 100 });
```

**Tag format:** Each property test is tagged with a comment:
```javascript
// Feature: chatbot-integration, Property N: <property_text>
```

### Integration Tests

Integration tests verify the wiring between components with real HTTP calls against a test server instance (OpenAI calls are mocked).

- Full SSE stream: POST `/api/chat` with mocked OpenAI → verify `data:` events arrive and `[DONE]` terminates the stream
- File upload round-trip: POST `/api/chat/upload` with a real file → verify file is stored in `uploads/` and response contains correct metadata
- Rate limiter integration: send 101 requests in sequence → verify 101st returns 429

### Manual / Exploratory Tests

- Voice input: test in Chrome (full support) and Firefox (partial support) — verify mic button is hidden in unsupported browsers
- Drag-and-drop file: verify drop zone activates on hover and file preview renders
- Keyboard navigation: Tab through all controls, Enter to send, Escape to close panel
- Mobile viewport (320px): verify panel expands to full viewport
- Streaming interruption: kill server mid-stream → verify error message appears and input re-enables
