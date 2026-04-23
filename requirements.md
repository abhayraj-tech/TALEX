# Requirements Document

## Introduction

This feature integrates an AI-powered chatbot assistant into the TALEX platform — a skill-learning web app where students discover events, complete courses, earn credits, and get hired. The chatbot ("TALEX AI") will be accessible from the student dashboard as a floating widget, providing contextual learning support, course guidance, and general Q&A. The integration adapts the existing React-based chatbot assets into a vanilla JavaScript widget that works within the current HTML/CSS/JS architecture, with the AI backend merged into the existing Express server.

## Glossary

- **TALEX_AI**: The AI chatbot assistant embedded in the TALEX platform dashboard.
- **Chat_Widget**: The floating UI element on the dashboard that opens and closes the chat panel.
- **Chat_Panel**: The expanded chat interface showing message history and input controls.
- **Chat_Backend**: The Express route(s) added to `server/server.js` that proxy requests to the OpenAI API.
- **SSE_Stream**: Server-Sent Events stream used to deliver AI response tokens incrementally to the client.
- **Message_History**: The ordered list of user and assistant messages within a single chat session.
- **Session**: A single browser session; message history persists in memory until the page is refreshed or the chat is cleared.
- **OpenAI_API**: The external OpenAI service used to generate AI responses via the `gpt-4o-mini` model.
- **Rate_Limiter**: Server-side middleware that restricts the number of chat requests per IP address within a time window.
- **Voice_Input**: Speech-to-text input captured via the browser's Web Speech API.
- **File_Upload**: Attachment of image or document files to a chat message for AI analysis.
- **Dashboard**: The `dashboard.html` page — the primary surface where the Chat_Widget is embedded.

---

## Requirements

### Requirement 1: Chat Widget Launcher

**User Story:** As a student, I want a persistent chat button on the dashboard, so that I can open the TALEX AI assistant at any time without leaving my current view.

#### Acceptance Criteria

1. THE Chat_Widget SHALL render as a fixed-position floating action button in the bottom-right corner of the Dashboard.
2. WHEN the student clicks the Chat_Widget button, THE Chat_Panel SHALL expand and become visible.
3. WHEN the Chat_Panel is open and the student clicks the Chat_Widget button again, THE Chat_Panel SHALL collapse and become hidden.
4. WHILE the Chat_Panel is open, THE Chat_Widget button SHALL display a close icon.
5. WHILE the Chat_Panel is closed, THE Chat_Widget button SHALL display a bot/chat icon.
6. THE Chat_Widget SHALL remain visible and accessible across all sidebar navigation views (Dashboard, Courses, Skills, Badges, Communities, Settings).

---

### Requirement 2: Chat Message Interface

**User Story:** As a student, I want to type messages and receive AI responses in a chat interface, so that I can get learning support and answers to my questions.

#### Acceptance Criteria

1. THE Chat_Panel SHALL display a scrollable Message_History area showing all messages in the current Session.
2. THE Chat_Panel SHALL display a text input field and a send button at the bottom of the panel.
3. WHEN the student submits a message via the send button or by pressing the Enter key, THE Chat_Widget SHALL append the user message to the Message_History immediately.
4. WHEN a user message is submitted, THE Chat_Backend SHALL send the message to the OpenAI_API and return a response via SSE_Stream.
5. WHILE the OpenAI_API response is streaming, THE Chat_Panel SHALL display the assistant message incrementally, appending each token as it arrives.
6. WHEN the SSE_Stream sends the `[DONE]` signal, THE Chat_Panel SHALL mark the assistant message as complete and stop the streaming indicator.
7. THE Chat_Panel SHALL automatically scroll to the latest message after each new message is appended.
8. WHEN the Message_History is empty, THE Chat_Panel SHALL display a welcome message prompting the student to ask a question.

---

### Requirement 3: AI Backend Integration

**User Story:** As a developer, I want the chatbot backend merged into the existing Express server, so that the platform runs as a single server without requiring a separate process.

#### Acceptance Criteria

1. THE Chat_Backend SHALL expose a `POST /api/chat` endpoint on the existing `server/server.js` Express application.
2. WHEN a valid request is received at `POST /api/chat`, THE Chat_Backend SHALL forward the message to the OpenAI_API using the `gpt-4o-mini` model with streaming enabled.
3. THE Chat_Backend SHALL use a system prompt that identifies the assistant as "TALEX AI, a helpful learning assistant for the TALEX skill-learning platform."
4. WHEN the OpenAI_API returns a streaming response, THE Chat_Backend SHALL relay each token to the client using the `text/event-stream` content type following the SSE protocol.
5. THE Chat_Backend SHALL read the OpenAI API key from the existing `server/.env` file using the `OPENAI_API_KEY` environment variable.
6. THE Rate_Limiter SHALL restrict requests to `POST /api/chat` to a maximum of 100 requests per IP address per 15-minute window.
7. IF the OpenAI_API returns an error, THEN THE Chat_Backend SHALL respond with HTTP status 500 and a JSON body containing a descriptive `error` field.
8. IF a request to `POST /api/chat` is missing the `message` field, THEN THE Chat_Backend SHALL respond with HTTP status 400 and a JSON body containing a descriptive `error` field.

---

### Requirement 4: Streaming Response Display

**User Story:** As a student, I want to see the AI response appear word-by-word as it is generated, so that I get faster perceived feedback and a more engaging experience.

#### Acceptance Criteria

1. WHEN the Chat_Backend begins streaming a response, THE Chat_Panel SHALL create a new assistant message bubble immediately and update its text content with each incoming SSE token.
2. WHILE a response is streaming, THE Chat_Panel SHALL display a visual loading indicator (e.g., animated dots) inside the assistant message bubble.
3. WHILE a response is streaming, THE Chat_Panel SHALL disable the send button and text input to prevent concurrent requests.
4. WHEN streaming completes, THE Chat_Panel SHALL re-enable the send button and text input.
5. IF the SSE_Stream connection is interrupted before `[DONE]` is received, THEN THE Chat_Panel SHALL display an inline error message in the assistant message bubble and re-enable the input controls.

---

### Requirement 5: Voice Input

**User Story:** As a student, I want to dictate my message using my microphone, so that I can interact with the chatbot hands-free.

#### Acceptance Criteria

1. WHERE the browser supports the Web Speech API, THE Chat_Panel SHALL display a microphone button in the input area.
2. WHEN the student clicks the microphone button, THE Chat_Panel SHALL start speech recognition and display a visual recording indicator.
3. WHILE speech recognition is active, THE Chat_Panel SHALL populate the text input field with the interim and final transcript in real time.
4. WHEN the student clicks the microphone button again while recording, THE Chat_Panel SHALL stop speech recognition.
5. WHERE the browser does not support the Web Speech API, THE Chat_Panel SHALL hide the microphone button.

---

### Requirement 6: File and Image Attachment

**User Story:** As a student, I want to attach images or documents to my chat message, so that I can ask the AI to analyze or explain them.

#### Acceptance Criteria

1. THE Chat_Panel SHALL display a file attachment button in the input area.
2. WHEN the student clicks the file attachment button, THE Chat_Panel SHALL open a file picker accepting images (PNG, JPG, JPEG, GIF) and documents (PDF, TXT).
3. WHEN the student drops a file onto the Chat_Panel, THE Chat_Panel SHALL accept the file via drag-and-drop.
4. WHEN a file is selected or dropped, THE Chat_Panel SHALL display a thumbnail or filename preview in the input area before sending.
5. WHEN the student submits a message with an attached file, THE Chat_Panel SHALL include the file reference in the message displayed in the Message_History.
6. THE Chat_Backend SHALL expose a `POST /api/chat/upload` endpoint that accepts multipart file uploads and stores them temporarily in an `uploads/` directory.
7. IF an uploaded file exceeds 10 MB, THEN THE Chat_Backend SHALL respond with HTTP status 413 and a JSON body containing a descriptive `error` field.

---

### Requirement 7: Message Actions

**User Story:** As a student, I want to copy AI responses and clear the chat history, so that I can manage and reuse the information I receive.

#### Acceptance Criteria

1. WHEN the student hovers over an assistant message, THE Chat_Panel SHALL display a copy-to-clipboard button on that message.
2. WHEN the student clicks the copy button on a message, THE Chat_Panel SHALL copy the message text to the system clipboard and display a brief confirmation toast notification.
3. THE Chat_Panel SHALL display a "Clear Chat" button in the panel header.
4. WHEN the student clicks "Clear Chat", THE Chat_Panel SHALL remove all messages from the Message_History and display the welcome message.

---

### Requirement 8: API Key Configuration

**User Story:** As a platform administrator, I want the OpenAI API key managed server-side via environment variables, so that the key is never exposed to the browser client.

#### Acceptance Criteria

1. THE Chat_Backend SHALL read the OpenAI API key exclusively from the `OPENAI_API_KEY` environment variable in `server/.env`.
2. THE Chat_Widget frontend SHALL NOT require or accept an API key from the user.
3. THE Chat_Widget frontend SHALL NOT store or transmit any OpenAI API key.
4. IF the `OPENAI_API_KEY` environment variable is not set at server startup, THEN THE Chat_Backend SHALL log a warning message to the console indicating the key is missing.
5. IF a request is received at `POST /api/chat` and the `OPENAI_API_KEY` is not configured, THEN THE Chat_Backend SHALL respond with HTTP status 503 and a JSON body with `error: "AI service is not configured"`.

---

### Requirement 9: Accessibility and Responsiveness

**User Story:** As a student using any device, I want the chatbot widget to be usable on both desktop and mobile screen sizes, so that I can access AI support regardless of my device.

#### Acceptance Criteria

1. THE Chat_Widget SHALL be fully operable using keyboard navigation (Tab, Enter, Escape keys).
2. WHEN the Escape key is pressed while the Chat_Panel is open, THE Chat_Panel SHALL close.
3. THE Chat_Widget button and all interactive controls within the Chat_Panel SHALL have descriptive `aria-label` attributes.
4. THE Chat_Panel SHALL adapt its width and height to fit within the viewport on screen widths from 320px to 1920px without horizontal overflow.
5. ON screen widths below 480px, THE Chat_Panel SHALL expand to occupy the full viewport width and height.
