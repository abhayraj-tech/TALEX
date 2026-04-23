/**
 * chatbot-widget.js
 * TALEX AI Chatbot Widget — vanilla JS, no build step required.
 * Injects the full chat UI into document.body on DOMContentLoaded.
 *
 * Requirements: 1.1, 9.1, 9.3
 */

/* ── Module-scoped state ─────────────────────────────────────────────────── */
let isPanelOpen = false;
let isStreaming = false;
let messages = [];        // Array<{ id, role, content, timestamp, isStreaming, fileRef }>
let recognition = null;   // SpeechRecognition instance or null
let isRecording = false;
let pendingFile = null;   // { file: File, previewUrl: string } | null

/* ── DOM factory helpers ─────────────────────────────────────────────────── */

/**
 * Create an element with optional attributes and children.
 * @param {string} tag
 * @param {Object} attrs  - key/value pairs; boolean true sets the attribute with no value
 * @param {...(Node|string)} children
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'hidden' && value === true) {
      node.hidden = true;
    } else if (value !== false && value !== null && value !== undefined) {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(
      typeof child === 'string' ? document.createTextNode(child) : child
    );
  }
  return node;
}

/* ── initChatWidget ──────────────────────────────────────────────────────── */

/**
 * Programmatically create and inject the full chat widget DOM into document.body.
 * Uses createElement exclusively (no innerHTML) for security.
 * Requirements: 1.1, 9.1, 9.3
 */
function initChatWidget() {
  /* ── Floating action button ─────────────────────────────────────────── */
  const iconBot = el('span', { class: 'talex-chat-icon-bot' }, '🤖');
  const iconClose = el('span', { class: 'talex-chat-icon-close', hidden: true }, '✕');

  const toggleBtn = el(
    'button',
    {
      id: 'talex-chat-toggle',
      class: 'talex-chat-toggle',
      'aria-label': 'Open TALEX AI chat',
    },
    iconBot,
    iconClose
  );

  /* ── Chat panel ─────────────────────────────────────────────────────── */

  /* Header — info section */
  const avatar = el('span', { class: 'talex-chat-avatar' }, '🤖');
  const botName = el('h3', {}, 'TALEX AI');
  const statusSpan = el('span', { class: 'talex-chat-status' }, 'Online');
  const headerInfoText = el('div', {}, botName, statusSpan);
  const headerInfo = el('div', { class: 'talex-chat-header-info' }, avatar, headerInfoText);

  /* Header — clear button */
  const clearBtn = el(
    'button',
    {
      class: 'talex-chat-clear',
      'aria-label': 'Clear chat history',
    },
    '🗑'
  );

  const header = el('div', { class: 'talex-chat-header' }, headerInfo, clearBtn);

  /* Messages area */
  const messagesArea = el('div', {
    id: 'talex-chat-messages',
    class: 'talex-chat-messages',
    role: 'log',
    'aria-live': 'polite',
    'aria-label': 'Chat messages',
  });

  /* Welcome message */
  const welcomeIcon = el('span', { class: 'talex-chat-welcome-icon' }, '🤖');
  const welcomeHeading = el('h4', {}, 'Hi! I\'m TALEX AI');
  const welcomeText = el('p', {}, 'Ask me anything about courses, skills, or your learning journey.');
  const welcomeEl = el(
    'div',
    { class: 'talex-chat-welcome', id: 'talex-chat-welcome' },
    welcomeIcon,
    welcomeHeading,
    welcomeText
  );
  messagesArea.appendChild(welcomeEl);

  /* File preview strip */
  const filePreview = el('div', {
    id: 'talex-chat-file-preview',
    class: 'talex-chat-file-preview',
    hidden: true,
  });

  /* Input area */
  const attachBtn = el(
    'button',
    {
      class: 'talex-chat-attach',
      'aria-label': 'Attach file',
      type: 'button',
    },
    '📎'
  );

  const fileInput = el('input', {
    type: 'file',
    id: 'talex-chat-file-input',
    accept: 'image/png,image/jpeg,image/gif,application/pdf,text/plain',
    hidden: true,
    'aria-label': 'File attachment input',
  });

  const micBtn = el(
    'button',
    {
      class: 'talex-chat-mic',
      'aria-label': 'Start voice input',
      type: 'button',
    },
    '🎤'
  );

  const textInput = el('input', {
    type: 'text',
    id: 'talex-chat-input',
    class: 'talex-chat-text-input',
    placeholder: 'Ask TALEX AI anything...',
    'aria-label': 'Chat message input',
  });

  const sendBtn = el(
    'button',
    {
      id: 'talex-chat-send',
      class: 'talex-chat-send',
      'aria-label': 'Send message',
      type: 'button',
    },
    '➤'
  );

  const inputArea = el(
    'div',
    { class: 'talex-chat-input-area' },
    attachBtn,
    fileInput,
    micBtn,
    textInput,
    sendBtn
  );

  /* Assemble panel */
  const panel = el(
    'div',
    {
      id: 'talex-chat-panel',
      class: 'talex-chat-panel',
      'aria-hidden': 'true',
      role: 'dialog',
      'aria-label': 'TALEX AI Chat',
    },
    header,
    messagesArea,
    filePreview,
    inputArea
  );

  /* ── Toast notification ─────────────────────────────────────────────── */
  const toast = el('div', {
    class: 'talex-chat-toast',
    id: 'talex-chat-toast',
    'aria-live': 'polite',
  });

  /* ── Inject into document.body ──────────────────────────────────────── */
  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);
  document.body.appendChild(toast);

  /* ── Panel toggle ───────────────────────────────────────────────────── */

  /**
   * Toggle the chat panel open or closed.
   * - Flips `isPanelOpen`
   * - Updates `aria-hidden` on the panel
   * - Swaps bot/close icons on the toggle button
   * - Updates `aria-label` on the toggle button
   * - When opening, focuses the text input for keyboard accessibility
   * Requirements: 1.2, 1.3, 1.4, 1.5, 9.1, 9.2
   */
  function toggleChatPanel() {
    isPanelOpen = !isPanelOpen;

    panel.setAttribute('aria-hidden', isPanelOpen ? 'false' : 'true');

    if (isPanelOpen) {
      iconBot.hidden = true;
      iconClose.hidden = false;
      toggleBtn.setAttribute('aria-label', 'Close TALEX AI chat');
      textInput.focus();
    } else {
      iconBot.hidden = false;
      iconClose.hidden = true;
      toggleBtn.setAttribute('aria-label', 'Open TALEX AI chat');
    }
  }

  /* Attach click listener to the toggle button */
  toggleBtn.addEventListener('click', toggleChatPanel);

  /* Close panel on Escape keydown when panel is open */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isPanelOpen) {
      toggleChatPanel();
      toggleBtn.focus();
    }
  });

  /* ── Message rendering ──────────────────────────────────────────────── */

  /**
   * Build the streaming indicator element (animated dots).
   * @returns {HTMLElement}
   */
  function createStreamingIndicator() {
    return el(
      'span',
      { class: 'talex-chat-streaming-indicator' },
      el('span', {}),
      el('span', {}),
      el('span', {})
    );
  }

  /**
   * Append a message bubble to messagesArea and auto-scroll to bottom.
   * Hides the welcome message on the first call.
   * Requirements: 2.1, 2.7, 2.8
   *
   * @param {{ id: string, role: string, content: string, isStreaming?: boolean, fileRef?: { name: string, previewUrl: string|null }|null }} msg
   */
  function renderMessage(msg) {
    /* Hide welcome message when first message is added */
    if (welcomeEl && !welcomeEl.hidden) {
      welcomeEl.hidden = true;
    }

    const roleClass =
      msg.role === 'user'
        ? 'talex-chat-message--user'
        : 'talex-chat-message--assistant';

    const bubble = el('div', { class: 'talex-chat-bubble' });

    if (msg.isStreaming) {
      bubble.appendChild(createStreamingIndicator());
    } else {
      bubble.textContent = msg.content;
    }

    const messageDiv = el(
      'div',
      {
        class: `talex-chat-message ${roleClass}`,
        'data-message-id': msg.id,
      },
      bubble
    );

    /* Add copy button to assistant messages */
    if (msg.role === 'assistant') {
      const copyBtn = el(
        'button',
        {
          class: 'talex-chat-copy',
          'aria-label': 'Copy message to clipboard',
          type: 'button',
        },
        '📋'
      );
      /* Read bubble's current textContent at click time so it works after streaming */
      copyBtn.addEventListener('click', function () {
        copyToClipboard(bubble.textContent);
      });
      messageDiv.appendChild(copyBtn);
    }

    if (msg.fileRef) {
      const fileRefEl = el('div', { class: 'talex-chat-file-ref' });
      fileRefEl.textContent = msg.fileRef.name;
      messageDiv.appendChild(fileRefEl);
    }

    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  /**
   * Update an existing streaming message bubble in place.
   * Requirements: 2.5, 4.1
   *
   * @param {string} id        - The data-message-id of the message to update
   * @param {string} content   - Accumulated content so far
   * @param {boolean} isDone   - Whether the stream has finished
   */
  function updateStreamingMessage(id, content, isDone) {
    const messageDiv = messagesArea.querySelector(`[data-message-id="${id}"]`);
    if (!messageDiv) return;

    const bubble = messageDiv.querySelector('.talex-chat-bubble');
    if (!bubble) return;

    /* Remove streaming indicator if present */
    const indicator = bubble.querySelector('.talex-chat-streaming-indicator');
    if (indicator) {
      bubble.removeChild(indicator);
    }

    if (isDone) {
      bubble.textContent = content;
    } else {
      bubble.textContent = content;
    }

    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  /**
   * Show the welcome message and clear all message elements from messagesArea
   * (except the welcome element itself).
   * Requirements: 2.1, 2.8
   */
  function showWelcome() {
    /* Remove all children except the welcome element */
    const children = Array.from(messagesArea.children);
    for (const child of children) {
      if (child !== welcomeEl) {
        messagesArea.removeChild(child);
      }
    }
    welcomeEl.hidden = false;
  }

  /* ── Toast helper ───────────────────────────────────────────────────── */

  /**
   * Show a brief toast notification.
   * @param {string} message
   */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('talex-chat-toast--visible');
    setTimeout(() => {
      toast.classList.remove('talex-chat-toast--visible');
    }, 3000);
  }

  /* ── Copy to clipboard ──────────────────────────────────────────────── */

  /**
   * Copy text to the clipboard and show a toast confirmation.
   * Falls back gracefully when the Clipboard API is unavailable.
   * Requirements: 7.1, 7.2
   *
   * @param {string} text - The text to copy
   */
  async function copyToClipboard(text) {
    if (!navigator.clipboard) {
      showToast('Copy not supported in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (_) {
      showToast('Copy not supported in this browser.');
    }
  }

  /**
   * Simulate a chat response for Demo Mode (when backend is unavailable).
   * @param {string} msgId
   * @param {string} userText
   */
  async function simulateDemoResponse(msgId, userText) {
    const input = userText.toLowerCase();
    let responseText = "I'm currently in Demo Mode because the backend server is unreachable. How can I help you with TALEX today?";

    if (input.includes('hello') || input.includes('hi')) {
      responseText = "Hi there! I'm TALEX AI. I can help you find courses, track your skills, or explain how our credit system works. What's on your mind?";
    } else if (input.includes('course') || input.includes('learn')) {
      responseText = "We have amazing courses in AI, Web Development, Design, and more! You can check the 'Explore' tab to see the full catalog. Do you have a specific skill you want to master?";
    } else if (input.includes('credit') || input.includes('earn')) {
      responseText = "In TALEX, you earn credits by completing courses and proving your skills. You can use these credits to unlock premium content or even get rewards! Want to know your current balance?";
    } else if (input.includes('skill')) {
      responseText = "Skills are the core of TALEX. Every course you take adds to your skill profile. You can see your progress in the 'Skills' section of your dashboard.";
    } else if (input.includes('who are you') || input.includes('talex ai')) {
      responseText = "I am TALEX AI, your personal learning companion. My goal is to help you navigate the platform and reach your career goals faster!";
    }

    // Simulate streaming
    const words = responseText.split(' ');
    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      updateStreamingMessage(msgId, currentText, i === words.length - 1);
      await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
    }
  }

  /* ── sendMessage ────────────────────────────────────────────────────── */

  /**
   * Send the current text input as a chat message.
   * Handles file upload (if pendingFile is set), SSE streaming, and all
   * error conditions.
   * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async function sendMessage() {
    /* 1. Trim input; bail on empty/whitespace-only */
    const trimmedText = textInput.value.trim();
    if (!trimmedText) return;

    /* 2. Get message text and clear the input */
    const messageText = trimmedText;
    textInput.value = '';

    /* 3. Create user message object */
    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      isStreaming: false,
      fileRef: pendingFile
        ? { name: pendingFile.file.name, previewUrl: pendingFile.previewUrl }
        : null,
    };

    /* 4. Push to messages array and render */
    messages.push(userMsg);
    renderMessage(userMsg);

    /* 5. Handle file upload if pendingFile is set */
    let uploadedFileRef = userMsg.fileRef;
    if (pendingFile) {
      const formData = new FormData();
      formData.append('file', pendingFile.file);

      let uploadResponse;
      try {
        uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (networkErr) {
        showToast('Upload failed. Please try again.');
        pendingFile = null;
        filePreview.hidden = true;
        filePreview.innerHTML = '';
        return;
      }

      if (uploadResponse.status === 413) {
        showToast('File exceeds 10 MB limit.');
        pendingFile = null;
        filePreview.hidden = true;
        filePreview.innerHTML = '';
        return;
      }

      if (!uploadResponse.ok) {
        showToast('File upload failed. Please try again.');
        pendingFile = null;
        filePreview.hidden = true;
        filePreview.innerHTML = '';
        return;
      }

      /* Clear pending file after successful upload */
      pendingFile = null;
      filePreview.hidden = true;
      filePreview.innerHTML = '';
    }

    /* 6. Create assistant message object */
    const assistantMsg = {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
      fileRef: null,
    };

    /* 7. Push to messages and render (shows streaming indicator) */
    messages.push(assistantMsg);
    renderMessage(assistantMsg);

    /* 8. Set streaming state, disable controls */
    isStreaming = true;
    sendBtn.disabled = true;
    textInput.disabled = true;

    /* Helper: re-enable controls */
    function reenableControls() {
      isStreaming = false;
      sendBtn.disabled = false;
      textInput.disabled = false;
      textInput.focus();
    }

    /* 9. Fetch POST /api/chat with Demo Mode Fallback */
    let response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
    } catch (networkErr) {
      /* FALLBACK TO DEMO MODE if server is unreachable */
      console.warn('[Chat] Server unreachable, switching to Demo Mode.');
      await simulateDemoResponse(assistantMsg.id, messageText);
      reenableControls();
      return;
    }

    /* 12. Handle HTTP error responses */
    if (!response.ok) {
      // If server returns error but is reachable, still try to fallback for specific codes
      if (response.status === 404 || response.status === 503) {
        await simulateDemoResponse(assistantMsg.id, messageText);
        reenableControls();
        return;
      }

      let errorMessage;
      try {
        const errBody = await response.json();
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment.';
        } else if (response.status === 503) {
          errorMessage = 'AI service is temporarily unavailable.';
        } else if (response.status === 400) {
          errorMessage = errBody.error || 'Bad request.';
        } else {
          errorMessage = 'Failed to generate response. Please try again.';
        }
      } catch (_) {
        errorMessage = 'Failed to generate response. Please try again.';
      }
      updateStreamingMessage(assistantMsg.id, errorMessage, true);
      reenableControls();
      return;
    }

    /* 10. Read response.body via ReadableStream + getReader() */
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let streamDone = false;

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          /* Stream ended without [DONE] */
          if (!streamDone) {
            /* 14. Handle SSE stream interruption before [DONE] */
            updateStreamingMessage(
              assistantMsg.id,
              accumulatedContent
                ? accumulatedContent + '\n\nResponse interrupted. Please try again.'
                : 'Response interrupted. Please try again.',
              true
            );
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const dataStr = line.slice('data: '.length).trim();

          if (dataStr === '[DONE]') {
            /* When [DONE] is received, finalize the message */
            updateStreamingMessage(assistantMsg.id, accumulatedContent, true);
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              accumulatedContent += parsed.content;
              updateStreamingMessage(assistantMsg.id, accumulatedContent, false);
            }
          } catch (_) {
            /* Ignore malformed JSON lines */
          }
        }

        if (streamDone) break;
      }
    } catch (streamErr) {
      /* 14. Handle SSE stream interruption */
      updateStreamingMessage(
        assistantMsg.id,
        accumulatedContent
          ? accumulatedContent + '\n\nResponse interrupted. Please try again.'
          : 'Response interrupted. Please try again.',
        true
      );
    }

    /* 11. On completion: re-enable controls */
    reenableControls();
  }

  /* ── clearChat ──────────────────────────────────────────────────────── */

  /**
   * Clear all messages and reset the widget to its initial welcome state.
   * - Resets the in-memory `messages` array to empty
   * - Clears any pending file attachment
   * - Calls `showWelcome()` to remove message bubbles and show the welcome element
   * Requirements: 7.3, 7.4
   */
  function clearChat() {
    /* Reset message history */
    messages = [];

    /* Clear any pending file */
    if (pendingFile) {
      pendingFile = null;
      filePreview.hidden = true;
      filePreview.innerHTML = '';
    }

    /* Clear DOM and show welcome message */
    showWelcome();
  }

  /* Attach click listener to the clear button */
  clearBtn.addEventListener('click', clearChat);

  /* ── Voice input ────────────────────────────────────────────────────── */

  /**
   * Toggle voice input on/off using the Web Speech API.
   * - Starts a new SpeechRecognition session when not recording
   * - Stops the active session when already recording
   * - Populates textInput with interim + final transcript in real time
   * - Shows/hides a recording indicator on micBtn
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    /* Feature not supported — hide the mic button silently */
    micBtn.hidden = true;
  } else {
    function toggleVoiceInput() {
      if (!isRecording) {
        /* ── Start recording ── */
        recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.addEventListener('result', function (event) {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          textInput.value = transcript;
        });

        recognition.addEventListener('end', function () {
          isRecording = false;
          micBtn.classList.remove('talex-chat-mic--recording');
          micBtn.setAttribute('aria-label', 'Start voice input');
        });

        recognition.addEventListener('error', function () {
          isRecording = false;
          micBtn.classList.remove('talex-chat-mic--recording');
          micBtn.setAttribute('aria-label', 'Start voice input');
        });

        recognition.start();
        isRecording = true;
        micBtn.classList.add('talex-chat-mic--recording');
        micBtn.setAttribute('aria-label', 'Stop voice input');
      } else {
        /* ── Stop recording ── */
        recognition.stop();
        isRecording = false;
        micBtn.classList.remove('talex-chat-mic--recording');
        micBtn.setAttribute('aria-label', 'Start voice input');
      }
    }

    /* Attach click listener to mic button */
    micBtn.addEventListener('click', toggleVoiceInput);
  }

  /* ── File attachment ───────────────────────────────────────────────── */

  /**
   * Handle a selected or dropped file: store it in `pendingFile`, build a
   * preview item in the `filePreview` strip, and show the strip.
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   *
   * @param {File} file
   */
  function handleFileSelected(file) {
    /* Create object URL for images */
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    pendingFile = { file, previewUrl };

    /* Clear and show the file preview strip */
    while (filePreview.firstChild) {
      filePreview.removeChild(filePreview.firstChild);
    }
    filePreview.hidden = false;

    /* Build preview item */
    const previewItem = el('div', { class: 'talex-chat-file-preview-item' });

    if (isImage) {
      const thumb = el('img', {
        src: previewUrl,
        alt: file.name,
        class: 'talex-chat-file-preview-thumb',
      });
      previewItem.appendChild(thumb);
    } else {
      const docIcon = el('span', { class: 'talex-chat-file-preview-icon' }, '📄');
      const fileName = el('span', { class: 'talex-chat-file-preview-name' }, file.name);
      previewItem.appendChild(docIcon);
      previewItem.appendChild(fileName);
    }

    /* Remove button */
    const removeBtn = el(
      'button',
      {
        class: 'talex-chat-file-preview-remove',
        'aria-label': 'Remove attachment',
        type: 'button',
      },
      '✕'
    );
    removeBtn.addEventListener('click', function () {
      pendingFile = null;
      filePreview.hidden = true;
      while (filePreview.firstChild) {
        filePreview.removeChild(filePreview.firstChild);
      }
      fileInput.value = '';
    });

    previewItem.appendChild(removeBtn);
    filePreview.appendChild(previewItem);
  }

  /* Attach button click → trigger hidden file input */
  attachBtn.addEventListener('click', () => fileInput.click());

  /* File input change → handle selected file */
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileSelected(e.target.files[0]);
  });

  /* Drag-and-drop on the chat panel */
  panel.addEventListener('dragover', (e) => {
    e.preventDefault();
    panel.classList.add('talex-chat-panel--drag-over');
  });

  panel.addEventListener('dragleave', () => {
    panel.classList.remove('talex-chat-panel--drag-over');
  });

  panel.addEventListener('drop', (e) => {
    e.preventDefault();
    panel.classList.remove('talex-chat-panel--drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });

  /* ── Event listeners for send ───────────────────────────────────────── */

  /* Send button click → sendMessage() */
  sendBtn.addEventListener('click', sendMessage);

  /* Text input keydown → Enter (not streaming) → sendMessage() */
  textInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !isStreaming) {
      sendMessage();
    }
  });

  /* Expose rendering functions on the widget's internal scope so other tasks
     (sendMessage, clearChat) can call them. Attach to a shared namespace. */
  initChatWidget._renderMessage = renderMessage;
  initChatWidget._updateStreamingMessage = updateStreamingMessage;
  initChatWidget._showWelcome = showWelcome;
  initChatWidget._showToast = showToast;
  initChatWidget._copyToClipboard = copyToClipboard;
}

/* ── Bootstrap on DOMContentLoaded ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initChatWidget);
