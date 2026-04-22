// ═══════════════════════════════════════════
// TALEX Dashboard — Interactive Logic
// ═══════════════════════════════════════════

// ── User Data ──
const currentUser = JSON.parse(localStorage.getItem('talex_user') || 'null');

(function initProfile() {
  if (!currentUser) return;
  const name = currentUser.name || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const el = (id) => document.getElementById(id);
  el('profileAvatar').textContent = initials;
  el('profileName').textContent = name;
  el('profileRole').textContent = `${currentUser.credits || 0} ⚡ Credits`;
  el('statCredits').textContent = currentUser.credits || 0;
})();

// ── Header Date ──
(function initHeaderDate() {
  const now = new Date();
  document.getElementById('calTriggerDay').textContent = now.getDate();
  const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
  const year = now.getFullYear();
  document.getElementById('calTriggerMonth').textContent = `${month} ${year}`;
})();

// ── Sidebar Navigation ──
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    if (item.id === 'sidebarCalBtn') toggleCalendar();
  });
});

// ── Back to Home ──
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'new.html';
});

// ── Search Filter ──
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.event-card').forEach(card => {
    const title = card.querySelector('.card-title').textContent.toLowerCase();
    card.style.display = title.includes(q) ? '' : 'none';
  });
});

// ── Register Buttons ──
document.querySelectorAll('.btn-register.primary').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.remove('primary');
    btn.classList.add('joined');
    btn.textContent = 'Joined ✓';
    btn.disabled = true;
  });
});

// ════════════════════════════════════════
// CALENDAR MODAL
// ════════════════════════════════════════

const calOverlay = document.getElementById('calModalOverlay');
const calGrid = document.getElementById('calGrid');
const calMonthYear = document.getElementById('calMonthYear');
const scheduleHeader = document.getElementById('scheduleHeader');
const scheduleList = document.getElementById('scheduleList');

let calDate = new Date();
let selectedDate = new Date();

// Sample events keyed by "YYYY-MM-DD"
const calEvents = {};
(function seedEvents() {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const pad = n => String(n).padStart(2, '0');
  const key = (d) => `${y}-${pad(m + 1)}-${pad(d)}`;

  calEvents[key(25)] = [
    { title: 'AI & ML Workshop', cat: 'academic', color: 'cyan', img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=100&q=60' },
  ];
  calEvents[key(28)] = [
    { title: 'Neon Cultural Night', cat: 'cultural', color: 'rose', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=60' },
    { title: 'Open Mic Session', cat: 'cultural', color: 'rose', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&q=60' },
  ];

  // Next month events
  const m2 = m + 1;
  const key2 = (d) => `${y}-${pad(m2 + 1)}-${pad(d)}`;
  calEvents[key2(2)] = [
    { title: 'Startup Pitch Day', cat: 'startup', color: 'teal', img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=100&q=60' },
  ];
  calEvents[key2(5)] = [
    { title: '48-Hour Hackathon', cat: 'academic', color: 'cyan', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&q=60' },
  ];
  calEvents[key2(8)] = [
    { title: 'Creative Design Sprint', cat: 'cultural', color: 'rose', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&q=60' },
  ];
  calEvents[key2(12)] = [
    { title: 'Data Analytics Bootcamp', cat: 'startup', color: 'teal', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&q=60' },
  ];

  // Today's events
  const todayKey = `${y}-${pad(m + 1)}-${pad(new Date().getDate())}`;
  if (!calEvents[todayKey]) {
    calEvents[todayKey] = [
      { title: 'Team Standup Meeting', cat: 'academic', color: 'cyan', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&q=60' },
    ];
  }
})();

function toggleCalendar() {
  calOverlay.classList.toggle('open');
  if (calOverlay.classList.contains('open')) renderCalendar();
}

document.getElementById('calendarTrigger').addEventListener('click', toggleCalendar);
calOverlay.addEventListener('click', (e) => {
  if (e.target === calOverlay) calOverlay.classList.remove('open');
});

document.getElementById('calPrev').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
});

function renderCalendar() {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthName = calDate.toLocaleString('en', { month: 'long' });
  calMonthYear.textContent = `${monthName} ${year}`;

  // Remove old day cells
  calGrid.querySelectorAll('.cal-day').forEach(d => d.remove());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const cell = createDayCell(d, true, null);
    calGrid.appendChild(cell);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
    const isToday = (d === today.getDate() && month === today.getMonth() && year === today.getFullYear());
    const isSelected = (d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear());
    const events = calEvents[dateKey] || null;
    const cell = createDayCell(d, false, events);
    if (isToday) cell.classList.add('today');
    if (isSelected) cell.classList.add('selected');
    cell.addEventListener('click', () => selectDay(d, month, year));
    calGrid.appendChild(cell);
  }

  // Next month fill
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const cell = createDayCell(d, true, null);
    calGrid.appendChild(cell);
  }

  renderSchedule();
}

function createDayCell(day, isOther, events) {
  const cell = document.createElement('div');
  cell.className = 'cal-day' + (isOther ? ' other-month' : '');
  let dots = '';
  if (events) {
    dots = events.slice(0, 3).map(e => `<span class="dot ${e.color}"></span>`).join('');
  }
  cell.innerHTML = `<div class="day-num">${day}</div><div class="event-dots">${dots}</div>`;
  return cell;
}

function selectDay(day, month, year) {
  selectedDate = new Date(year, month, day);
  renderCalendar();
}

function renderSchedule() {
  const pad = n => String(n).padStart(2, '0');
  const key = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
  const dateStr = selectedDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  scheduleHeader.textContent = `Schedule for ${dateStr}`;

  const events = calEvents[key];
  if (!events || events.length === 0) {
    scheduleList.innerHTML = `
      <div class="empty-schedule">
        <div class="empty-icon">📅</div>
        <p>No events scheduled</p>
      </div>`;
    return;
  }

  scheduleList.innerHTML = events.map(ev => `
    <div class="schedule-item">
      <div class="schedule-thumb"><img src="${ev.img}" alt="${ev.title}"></div>
      <div class="schedule-info">
        <div class="sch-cat ${ev.color}">${ev.cat}</div>
        <h4>${ev.title}</h4>
      </div>
    </div>
  `).join('');
}

// Initial render if modal is opened
renderCalendar();

// ════════════════════════════════════════
// PUBLISH & UPLOAD LOGIC
// ════════════════════════════════════════

const publishBtn = document.querySelector('.publish-btn');
const publishInput = document.getElementById('publishInput');
const uploadModalOverlay = document.getElementById('uploadModalOverlay');
const closeUpload = document.getElementById('closeUpload');
const uploadPreviewContainer = document.getElementById('uploadPreviewContainer');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');
const uploadTitle = document.getElementById('uploadTitle');
const publishedGrid = document.getElementById('publishedGrid');
const emptyPublished = document.getElementById('emptyPublished');

let selectedFile = null;

// Trigger file input
if (publishBtn && publishInput) {
  publishBtn.addEventListener('click', () => publishInput.click());
}

// Handle file selection
if (publishInput) {
  publishInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    uploadModalOverlay.classList.add('open');
    confirmUploadBtn.disabled = false;
    renderPreview(file);
  });
}

function renderPreview(file) {
  uploadPreviewContainer.innerHTML = '';
  const reader = new FileReader();

  if (file.type.startsWith('image/')) {
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      uploadPreviewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.controls = true;
    uploadPreviewContainer.appendChild(video);
  }
}

// Close upload modal
if (closeUpload) {
  closeUpload.addEventListener('click', () => {
    uploadModalOverlay.classList.remove('open');
    publishInput.value = '';
    selectedFile = null;
    uploadTitle.value = '';
  });
}

// Confirm upload
if (confirmUploadBtn) {
  confirmUploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle.value || 'Untitled Publication');

    confirmUploadBtn.disabled = true;
    confirmUploadBtn.textContent = 'Uploading...';

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('talex_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      showToast('Published successfully!', 'success');
      uploadModalOverlay.classList.remove('open');
      fetchPublishedContent();
      
      // Reset
      publishInput.value = '';
      selectedFile = null;
      uploadTitle.value = '';
      confirmUploadBtn.textContent = 'Upload & Publish';
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
      confirmUploadBtn.disabled = false;
      confirmUploadBtn.textContent = 'Upload & Publish';
    }
  });
}

// Fetch and display published content
async function fetchPublishedContent() {
  if (!publishedGrid) return;
  
  try {
    const res = await fetch('/api/upload', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('talex_token')}`
      }
    });
    const data = await res.json();
    
    if (data.contents && data.contents.length > 0) {
      if (emptyPublished) emptyPublished.style.display = 'none';
      renderPublishedItems(data.contents);
    } else {
      if (emptyPublished) emptyPublished.style.display = 'block';
      publishedGrid.querySelectorAll('.published-card').forEach(c => c.remove());
    }
  } catch (err) {
    console.error('Error fetching content:', err);
  }
}

function renderPublishedItems(items) {
  // Remove existing cards
  publishedGrid.querySelectorAll('.published-card').forEach(c => c.remove());

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'published-card';
    
    let mediaHtml = '';
    if (item.fileType === 'image') {
      mediaHtml = `<img src="${item.fileUrl}" alt="${item.title}">`;
    } else {
      mediaHtml = `<video src="${item.fileUrl}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
    }

    const date = new Date(item.createdAt).toLocaleDateString();

    card.innerHTML = `
      <div class="pub-media">${mediaHtml}</div>
      <div class="pub-info">
        <h4>${item.title}</h4>
        <span>Published on ${date}</span>
      </div>
    `;
    publishedGrid.appendChild(card);
  });
}

// Global Toast helper (copied from script.js if not available)
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '30px', right: '30px',
    padding: '12px 24px', borderRadius: '10px',
    background: type === 'success' ? '#10b981' : '#ef4444',
    color: '#fff', fontWeight: '600', zIndex: '10000',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    animation: 'toastIn 0.4s ease-out'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Load initial content
if (localStorage.getItem('talex_token')) {
  fetchPublishedContent();
}

