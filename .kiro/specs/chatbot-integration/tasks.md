# Implementation Plan: Chatbot Integration

## Overview

Integrate an AI-powered chatbot widget ("TALEX AI") into the TALEX platform dashboard. The implementation consists of three parts: a vanilla JS frontend widget (`chatbot-widget.js` + `chatbot-widget.css`) injected into `dashboard.html`, a new Express route module (`server/routes/chat.js`) merged into the existing server, and a test suite covering backend unit tests and property-based tests using fast-check.

## Tasks

- [ ] 1. Set up backend chat route module
  - Create `server/routes/chat.js` as an Express router
  - Add `OPENAI_API_KEY` presence check at module load time; log `⚠️  WARNING: OPENAI_API_KEY is not set. Chat endpoint will return 503.` if missing
  - Install `openai` and `express-rate-limit` packages in `server/` (`npm install openai express-rate-limit`)
  - Define `POST /` handler (mounted at `/api/chat`) that validates the `message` field, checks for the API key, and streams OpenAI `gpt-4o-mini` completions back as SSE (`text/event-stream`) following the `data: {"content":"..."}` / `data: [DONE]` protocol
  - Define `POST /upload` handler using `multer` with `limits.fileSize = 10 * 1024 * 1024`; accept `image/png`, `image/jpeg`, `image/gif`, `application/pdf`, `text/plain`; store files in `server/uploads/`; return `{ filename, originalName, mimeType, size }`
  - Wire the rate limiter (`windowMs: 15 * 60 * 1000, max: 100`) in `server/server.js` before mounting the chat router
  - Mount the chat router in `server/server.js`: `app.use('/api/chat', chatLimiter, require('./routes/chat'))`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.6, 6.7, 8.1, 8.4, 8.5_

- [ ] 2. Backend unit and property tests
  - [ ] 2.1 Set up test infrastructure
    - Install `jest`, `supertest`, and `fast-check` as dev dependencies in `server/`
    - Add `"test": "jest --testEnvironment node"` script to `server/package.json`
    - Create `server/tests/chat.test.js`
    - _Requirements: 3.1–3.8, 6.7, 8.5_

  - [ ]* 2.2 Write unit tests for `POST /api/chat`
    - Missing `message` field → 400 with `error` string
    - Empty string `message` → 400 with `error` string
    - Whitespace-only `message` → 400 with `error` string
    - `OPENAI_API_KEY` unset → 503 with `error: "AI service is not configured"`
    - _Requirements: 3.7, 3.8, 8.5_

  - [ ]* 2.3 Write unit tests for `POST /api/chat/upload`
    - Valid image upload → 200 with `{ filename, originalName, mimeType, size }`
    - File > 10 MB → 413 with `error` string
    - _Requirements: 6.6, 6.7_

  - [ ]* 2.4 Write unit tests for rate limiter
    - 101st request within 15-minute window → 429
    - _Requirements: 3.6_

  - [ ]* 2.5 Write property test — Property 6: Missing or empty message field returns 400
    - **Property 6: Missing or empty message field returns 400**
    - For any request body where `message` is absent, `null`, `undefined`, or empty/whitespace-only, server returns HTTP 400 with a non-empty `error` field
    - **Validates: Requirements 3.8**

  - [ ]* 2.6 Write property test — Property 7: File size limit enforced at upload
    - **Property 7: File size limit enforced at upload**
    - For any file whose byte size exceeds 10,485,760 bytes, `POST /api/chat/upload` returns HTTP 413 with a non-empty `error` field
    - **Validates: Requirements 6.7**

  - [ ]* 2.7 Write property test — Property 8: API key absence returns 503 for any request
    - **Property 8: API key absence returns 503 for any request**
    - For any valid `message` string, when `OPENAI_API_KEY` is unset, server returns HTTP 503 with `error: "AI service is not configured"`
    - **Validates: Requirements 8.5**

- [ ] 3. Checkpoint — Ensure all backend tests pass
  - Run `npm test` in `server/`. Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create chatbot widget CSS (`chatbot-widget.css`)
  - Create `chatbot-widget.css` in the workspace root (alongside `dashboard.css`)
  - All selectors prefixed with `.talex-chat-` to avoid collisions
  - Use existing CSS custom properties: `--cyan`, `--bg-surface`, `--border`, `--text`, `--muted`
  - Style the floating action button (fixed, bottom-right, z-index above dashboard)
  - Style the chat panel (fixed panel, responsive width/height, `aria-hidden` transitions)
  - Style message bubbles (user vs assistant), streaming indicator (animated dots), file preview strip, input area, mic button, attach button, send button, clear button, copy button (visible on hover), toast notification
  - Responsive: panel adapts from 320px to 1920px; on widths < 480px panel expands to full viewport width and height
  - _Requirements: 1.1, 2.1, 2.2, 4.2, 6.4, 7.1, 7.2, 9.4, 9.5_

- [ ] 5. Create chatbot widget JS (`chatbot-widget.js`)
  - [ ] 5.1 Scaffold module and DOM injection
    - Create `chatbot-widget.js` in the workspace root
    - Implement `initChatWidget()`: programmatically create and inject the full DOM structure (toggle button + chat panel) into `document.body` as specified in the design
    - Set all `aria-label` attributes on every interactive element (toggle button, send, mic, attach, clear, text input, copy buttons)
    - Call `initChatWidget()` on `DOMContentLoaded`
    - _Requirements: 1.1, 9.1, 9.3_

  - [ ] 5.2 Implement panel toggle and keyboard navigation
    - Implement `toggleChatPanel()`: toggle `isPanelOpen`, update `aria-hidden` on the panel, swap bot/close icons on the toggle button
    - Attach click listener to the toggle button calling `toggleChatPanel()`
    - Close panel on `Escape` keydown when panel is open
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_

  - [ ] 5.3 Implement message rendering and welcome state
    - Implement message rendering: append user and assistant message bubbles to `#talex-chat-messages`; auto-scroll to latest message after each append
    - Show welcome message when `messages` array is empty; hide it when first message is added
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ] 5.4 Implement `sendMessage()` with SSE streaming
    - Implement `sendMessage()`: trim input, reject empty/whitespace-only strings without network call, append user message to `messages` and render it, disable send button and text input, open `fetch` to `POST /api/chat` with `{ message, model }`, read `response.body` via `ReadableStream` + `getReader()`, parse `data:` lines, accumulate tokens into the assistant bubble, handle `[DONE]` to close stream and re-enable controls
    - Attach send button click and `Enter` keydown listeners
    - Handle HTTP error responses (400, 429, 503, 500) with inline error bubbles and re-enable controls
    - Handle fetch/network errors with inline error bubble and re-enable controls
    - Handle SSE stream interruption before `[DONE]` with inline error bubble and re-enable controls
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 5.5 Implement `clearChat()`
    - Implement `clearChat()`: reset `messages` to `[]`, clear `#talex-chat-messages` DOM, show welcome message
    - Attach click listener to the clear button in the panel header
    - _Requirements: 7.3, 7.4_

  - [ ] 5.6 Implement copy-to-clipboard and toast
    - Implement `copyToClipboard(text)`: use `navigator.clipboard.writeText`; show brief toast confirmation on success; show toast "Copy not supported in this browser." if Clipboard API unavailable
    - Render copy button on assistant message bubbles (visible on hover); attach click listener calling `copyToClipboard`
    - _Requirements: 7.1, 7.2_

  - [ ] 5.7 Implement voice input (`toggleVoiceInput()`)
    - Detect `window.SpeechRecognition || window.webkitSpeechRecognition`; hide mic button if unsupported
    - Implement `toggleVoiceInput()`: start/stop `SpeechRecognition`; populate text input with interim and final transcript in real time; show/hide recording indicator on mic button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.8 Implement file attachment
    - Attach click listener to attach button to trigger hidden `#talex-chat-file-input`
    - Handle `change` event on file input: store file in `pendingFile`, show thumbnail (images) or filename preview in `#talex-chat-file-preview`
    - Implement drag-and-drop on the chat panel: accept `dragover` and `drop` events, extract file, apply same preview logic
    - On `sendMessage()` with `pendingFile`: `POST /api/chat/upload` (multipart), include `fileRef` in the message history entry, render file reference in the message bubble, clear `pendingFile` and preview strip after send
    - Handle HTTP 413 from upload with toast "File exceeds 10 MB limit." and clear pending file
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Frontend property tests (jsdom)
  - [ ]* 6.1 Write property test — Property 1: Message submission grows history
    - **Property 1: Message submission grows history**
    - For any non-empty string, submitting it grows `messages` by exactly 1 with `role: "user"` and matching `content`
    - **Validates: Requirements 2.3**

  - [ ]* 6.2 Write property test — Property 2: Whitespace-only input is rejected
    - **Property 2: Whitespace-only input is rejected**
    - For any whitespace-only string, submission leaves `messages` unchanged and does not call `fetch`
    - **Validates: Requirements 2.3**

  - [ ]* 6.3 Write property test — Property 3: SSE token accumulation is monotonically growing
    - **Property 3: SSE token accumulation is monotonically growing**
    - For any ordered sequence of token strings, the accumulated content equals their concatenation
    - **Validates: Requirements 2.5, 4.1**

  - [ ]* 6.4 Write property test — Property 4: Control disabled state always matches streaming state
    - **Property 4: Control disabled state always matches streaming state**
    - Send button and text input `disabled` attributes are both `true` when streaming is active and `false` when inactive
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 6.5 Write property test — Property 5: Clear chat resets to empty state
    - **Property 5: Clear chat resets to empty state**
    - For any message history of any length, `clearChat()` results in `messages.length === 0` and the welcome message being visible
    - **Validates: Requirements 7.4**

  - [ ]* 6.6 Write property test — Property 9: All interactive widget controls have aria-labels
    - **Property 9: All interactive widget controls have aria-labels**
    - Every button and input rendered within the chat widget DOM has a non-empty `aria-label` attribute
    - **Validates: Requirements 9.3**

  - [ ]* 6.7 Write property test — Property 10: File attachment is reflected in message history
    - **Property 10: File attachment is reflected in message history**
    - For any file object attached before submission, the resulting message history entry contains a `fileRef.name` equal to the file's original name
    - **Validates: Requirements 6.5**

- [ ] 7. Wire widget into `dashboard.html`
  - Add `<link rel="stylesheet" href="chatbot-widget.css">` to the `<head>` of `dashboard.html`
  - Add `<script src="chatbot-widget.js"></script>` before the closing `</body>` tag of `dashboard.html`
  - Verify the widget does not conflict with existing dashboard scripts or CSS (check for selector collisions)
  - _Requirements: 1.1, 1.6_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Run `npm test` in `server/`. Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (`npm install --save-dev fast-check` in `server/`)
- Frontend property tests (task 6) require a jsdom environment; configure Jest with `testEnvironment: jsdom` for those test files
- The `server/uploads/` directory should be added to `.gitignore`
- The `OPENAI_API_KEY` must be added to `server/.env` before the chat endpoint will function
