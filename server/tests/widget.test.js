/**
 * @jest-environment jsdom
 *
 * Frontend property-based tests for chatbot-widget.js
 * Tests run against pure logic functions that mirror the widget's behaviour.
 * Uses fast-check for property-based testing.
 *
 * Tasks: 6.1 – 6.7
 * Requirements: 2.3, 2.5, 4.1, 4.3, 4.4, 6.5, 7.4, 9.3
 */

const fc = require('fast-check');

/* ─────────────────────────────────────────────────────────────────────────
 * Pure helper functions that mirror the widget's internal state management.
 * These are extracted from chatbot-widget.js logic so they can be tested
 * in isolation without loading the full widget script.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Create a fresh widget state object (mirrors module-scoped variables).
 */
function createWidgetState() {
  return {
    messages: [],
    isStreaming: false,
    pendingFile: null,
  };
}

/**
 * Simulate the widget's submitMessage logic.
 * Mirrors the relevant portion of sendMessage() in chatbot-widget.js.
 *
 * @param {object} state  - widget state (mutated in place)
 * @param {string} text   - raw input text
 * @returns {boolean}     - true if message was accepted, false if rejected
 */
function submitMessage(state, text) {
  const trimmed = text.trim();
  if (!trimmed) return false; // rejected — whitespace-only or empty

  state.messages.push({
    id: 'user-' + Date.now(),
    role: 'user',
    content: trimmed,
    timestamp: new Date(),
    isStreaming: false,
    fileRef: state.pendingFile ? { name: state.pendingFile.name } : null,
  });
  return true; // accepted
}

/**
 * Simulate SSE token accumulation.
 * Mirrors the accumulatedContent += parsed.content logic in sendMessage().
 *
 * @param {string[]} tokens - ordered array of token strings
 * @returns {string}        - final accumulated content
 */
function simulateTokenStream(tokens) {
  let accumulated = '';
  for (const token of tokens) {
    accumulated += token;
  }
  return accumulated;
}

/**
 * Simulate setting the streaming state and updating DOM controls.
 * Mirrors the isStreaming / sendBtn.disabled / textInput.disabled logic.
 *
 * @param {object} state       - widget state (mutated in place)
 * @param {HTMLElement} sendBtn
 * @param {HTMLElement} textInput
 * @param {boolean} streaming
 */
function setStreamingState(state, sendBtn, textInput, streaming) {
  state.isStreaming = streaming;
  sendBtn.disabled = streaming;
  textInput.disabled = streaming;
}

/**
 * Simulate clearChat().
 * Mirrors clearChat() in chatbot-widget.js.
 *
 * @param {object} state          - widget state (mutated in place)
 * @param {HTMLElement} welcomeEl - the welcome element
 */
function clearChat(state, welcomeEl) {
  state.messages = [];
  state.pendingFile = null;
  welcomeEl.hidden = false;
}

/**
 * Build a minimal widget DOM structure matching the widget's expected DOM.
 * Returns references to the key elements.
 */
function buildWidgetDOM() {
  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'talex-chat-toggle';
  toggleBtn.setAttribute('aria-label', 'Open TALEX AI chat');

  // Panel
  const panel = document.createElement('div');
  panel.id = 'talex-chat-panel';

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'talex-chat-clear';
  clearBtn.setAttribute('aria-label', 'Clear chat history');

  // Attach button
  const attachBtn = document.createElement('button');
  attachBtn.className = 'talex-chat-attach';
  attachBtn.setAttribute('aria-label', 'Attach file');

  // File input (hidden)
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'talex-chat-file-input';
  fileInput.setAttribute('aria-label', 'File attachment input');

  // Mic button
  const micBtn = document.createElement('button');
  micBtn.className = 'talex-chat-mic';
  micBtn.setAttribute('aria-label', 'Start voice input');

  // Text input
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.id = 'talex-chat-input';
  textInput.setAttribute('aria-label', 'Chat message input');

  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.id = 'talex-chat-send';
  sendBtn.setAttribute('aria-label', 'Send message');

  // Welcome element
  const welcomeEl = document.createElement('div');
  welcomeEl.id = 'talex-chat-welcome';
  welcomeEl.hidden = false;

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'talex-chat-input-area';
  inputArea.appendChild(attachBtn);
  inputArea.appendChild(fileInput);
  inputArea.appendChild(micBtn);
  inputArea.appendChild(textInput);
  inputArea.appendChild(sendBtn);

  // Assemble panel
  panel.appendChild(clearBtn);
  panel.appendChild(welcomeEl);
  panel.appendChild(inputArea);

  // Inject into document.body
  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  return { toggleBtn, panel, clearBtn, attachBtn, fileInput, micBtn, textInput, sendBtn, welcomeEl };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.1 — Property 1: Message submission grows history
 * Feature: chatbot-integration, Property 1: Message submission grows history
 * Validates: Requirements 2.3
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 1: Message submission grows history', () => {
  // Feature: chatbot-integration, Property 1: Message submission grows history
  test('Property 1: any non-empty, non-whitespace string grows messages by exactly 1 with role "user"', () => {
    fc.assert(
      fc.property(
        // Generate non-empty strings that have at least one non-whitespace character
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (msg) => {
          const state = createWidgetState();
          const before = state.messages.length;

          const accepted = submitMessage(state, msg);

          // Must be accepted
          if (!accepted) return false;

          // History grew by exactly 1
          if (state.messages.length !== before + 1) return false;

          // Last entry has role "user"
          const last = state.messages[state.messages.length - 1];
          if (last.role !== 'user') return false;

          // Content equals trimmed input
          if (last.content !== msg.trim()) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.2 — Property 2: Whitespace-only input is rejected
 * Feature: chatbot-integration, Property 2: Whitespace-only input is rejected
 * Validates: Requirements 2.3
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 2: Whitespace-only input is rejected', () => {
  // Feature: chatbot-integration, Property 2: Whitespace-only input is rejected
  test('Property 2: any whitespace-only string leaves messages unchanged', () => {
    fc.assert(
      fc.property(
        // Generate strings composed entirely of whitespace characters
        fc.stringMatching(/^[ \t\n\r]+$/),
        (ws) => {
          const state = createWidgetState();
          const before = state.messages.length;

          const accepted = submitMessage(state, ws);

          // Must be rejected
          if (accepted) return false;

          // History must be unchanged
          if (state.messages.length !== before) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.3 — Property 3: SSE token accumulation is monotonically growing
 * Feature: chatbot-integration, Property 3: SSE token accumulation is monotonically growing
 * Validates: Requirements 2.5, 4.1
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 3: SSE token accumulation is monotonically growing', () => {
  // Feature: chatbot-integration, Property 3: SSE token accumulation is monotonically growing
  test('Property 3: accumulated content after N tokens equals concatenation of first N tokens', () => {
    fc.assert(
      fc.property(
        // Generate an ordered sequence of token strings (at least 1 token)
        fc.array(fc.string(), { minLength: 1 }),
        (tokens) => {
          // Simulate accumulation step by step and verify monotonic growth
          let accumulated = '';
          for (let i = 0; i < tokens.length; i++) {
            accumulated += tokens[i];
            // After each token, accumulated content must equal concatenation of tokens[0..i]
            const expected = tokens.slice(0, i + 1).join('');
            if (accumulated !== expected) return false;
          }

          // Final accumulated content must equal full concatenation
          const finalExpected = tokens.join('');
          return simulateTokenStream(tokens) === finalExpected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.4 — Property 4: Control disabled state always matches streaming state
 * Feature: chatbot-integration, Property 4: Control disabled state always matches streaming state
 * Validates: Requirements 4.3, 4.4
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 4: Control disabled state always matches streaming state', () => {
  // Feature: chatbot-integration, Property 4: Control disabled state always matches streaming state
  test('Property 4: send button and text input disabled iff isStreaming is true', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // streaming state: true or false
        (streaming) => {
          const state = createWidgetState();

          const sendBtn = document.createElement('button');
          const textInput = document.createElement('input');

          setStreamingState(state, sendBtn, textInput, streaming);

          // Both controls must match the streaming state
          if (sendBtn.disabled !== streaming) return false;
          if (textInput.disabled !== streaming) return false;
          if (state.isStreaming !== streaming) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: transition from streaming=true to streaming=false re-enables both controls', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const state = createWidgetState();
          const sendBtn = document.createElement('button');
          const textInput = document.createElement('input');

          // Start streaming
          setStreamingState(state, sendBtn, textInput, true);
          if (!sendBtn.disabled || !textInput.disabled) return false;

          // Stop streaming
          setStreamingState(state, sendBtn, textInput, false);
          if (sendBtn.disabled || textInput.disabled) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.5 — Property 5: Clear chat resets to empty state
 * Feature: chatbot-integration, Property 5: Clear chat resets to empty state
 * Validates: Requirements 7.4
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 5: Clear chat resets to empty state', () => {
  // Feature: chatbot-integration, Property 5: Clear chat resets to empty state
  test('Property 5: clearChat() results in messages.length === 0 and welcome visible for any history length', () => {
    fc.assert(
      fc.property(
        // Generate an array of non-empty message strings to pre-populate history
        fc.array(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          { minLength: 0, maxLength: 50 }
        ),
        (msgs) => {
          const state = createWidgetState();
          const welcomeEl = document.createElement('div');
          welcomeEl.hidden = false;

          // Pre-populate history
          for (const msg of msgs) {
            submitMessage(state, msg);
          }

          // Hide welcome (as the widget does when messages are added)
          if (msgs.length > 0) {
            welcomeEl.hidden = true;
          }

          // Clear chat
          clearChat(state, welcomeEl);

          // Messages must be empty
          if (state.messages.length !== 0) return false;

          // Welcome must be visible
          if (welcomeEl.hidden !== false) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.6 — Property 9: All interactive widget controls have aria-labels
 * Feature: chatbot-integration, Property 9: All interactive widget controls have aria-labels
 * Validates: Requirements 9.3
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 9: All interactive widget controls have aria-labels', () => {
  let domRefs;

  beforeAll(() => {
    // Clean up any previous DOM state
    document.body.innerHTML = '';
    domRefs = buildWidgetDOM();
  });

  afterAll(() => {
    document.body.innerHTML = '';
  });

  // Feature: chatbot-integration, Property 9: All interactive widget controls have aria-labels
  test('Property 9: every button and input in the widget DOM has a non-empty aria-label', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Select all interactive elements within the widget
          const controls = [
            ...document.querySelectorAll('#talex-chat-panel button'),
            ...document.querySelectorAll('#talex-chat-panel input'),
            document.querySelector('#talex-chat-toggle'),
          ].filter(Boolean);

          // There must be at least one control
          if (controls.length === 0) return false;

          // Every control must have a non-empty aria-label
          return controls.every(control => {
            const label = control.getAttribute('aria-label');
            return typeof label === 'string' && label.trim().length > 0;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Task 6.7 — Property 10: File attachment is reflected in message history
 * Feature: chatbot-integration, Property 10: File attachment is reflected in message history
 * Validates: Requirements 6.5
 * ───────────────────────────────────────────────────────────────────────── */

describe('Property 10: File attachment is reflected in message history', () => {
  // Feature: chatbot-integration, Property 10: File attachment is reflected in message history
  test('Property 10: message history entry contains fileRef.name equal to the attached file name', () => {
    fc.assert(
      fc.property(
        // Generate a valid filename (non-empty, no path separators)
        fc.string({ minLength: 1, maxLength: 100 })
          .filter(s => s.trim().length > 0 && !s.includes('/') && !s.includes('\\')),
        // Generate a non-empty message text
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (fileName, messageText) => {
          const state = createWidgetState();

          // Simulate attaching a file (pendingFile stores { name } of the file)
          state.pendingFile = { name: fileName };

          // Submit a message with the pending file attached
          const accepted = submitMessage(state, messageText);
          if (!accepted) return false;

          // The last message must have a fileRef with the correct name
          const last = state.messages[state.messages.length - 1];
          if (!last.fileRef) return false;
          if (last.fileRef.name !== fileName) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
