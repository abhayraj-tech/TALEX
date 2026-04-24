// ═══════════════════════════════════════════
// TALEX Dashboard — Interactive Logic
// ═══════════════════════════════════════════

// ── Auth Check ──
if (!sessionStorage.getItem('talex_token')) {
  window.location.href = 'new.html';
}

// ── User Data ──
const currentUser = JSON.parse(sessionStorage.getItem('talex_user') || 'null');

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

// Sidebar navigation is now handled by the router in dashboard.html

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
const publishInputImage = document.getElementById('publishInputImage');
const publishInputVideo = document.getElementById('publishInputVideo');
const uploadModalOverlay = document.getElementById('uploadModalOverlay');
const closeUpload = document.getElementById('closeUpload');
const uploadPreviewContainer = document.getElementById('uploadPreviewContainer');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');
const uploadTitle = document.getElementById('uploadTitle');
const publishedGrid = document.getElementById('publishedGrid');
const emptyPublished = document.getElementById('emptyPublished');
const uploadStep1 = document.getElementById('uploadStep1');
const uploadStep2 = document.getElementById('uploadStep2');
const uploadModalTitle = document.getElementById('uploadModalTitle');
const chooseImageBtn = document.getElementById('chooseImageBtn');
const chooseVideoBtn = document.getElementById('chooseVideoBtn');

let selectedFile = null;
let selectedFileType = null;

// Open modal to step 1 (type selection)
function openPublishModal() {
  resetPublishModal();
  uploadModalOverlay.style.display = 'flex';
}

function resetPublishModal() {
  uploadStep1.style.display = 'block';
  uploadStep2.style.display = 'none';
  uploadModalTitle.textContent = 'What are you publishing?';
  uploadPreviewContainer.innerHTML = `
    <div class="upload-placeholder">
      <div class="placeholder-icon">📁</div>
      <p>Selected file will appear here</p>
    </div>`;
  uploadTitle.value = '';
  confirmUploadBtn.disabled = true;
  selectedFile = null;
  selectedFileType = null;
  publishInputImage.value = '';
  publishInputVideo.value = '';
}

// Publish button opens modal
if (publishBtn) {
  publishBtn.addEventListener('click', openPublishModal);
}

// Also handle the onclick on the button in HTML (override it)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.publish-btn');
  if (btn) btn.onclick = openPublishModal;
});

// Step 1: Choose Image
if (chooseImageBtn) {
  chooseImageBtn.addEventListener('click', () => {
    selectedFileType = 'image';
    publishInputImage.click();
  });
}

// Step 1: Choose Video
if (chooseVideoBtn) {
  chooseVideoBtn.addEventListener('click', () => {
    selectedFileType = 'video';
    publishInputVideo.click();
  });
}

// Handle image file selected
if (publishInputImage) {
  publishInputImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    goToStep2('image');
    renderPreview(file);
  });
}

// Handle video file selected
if (publishInputVideo) {
  publishInputVideo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    goToStep2('video');
    renderPreview(file);
  });
}

function goToStep2(type) {
  uploadStep1.style.display = 'none';
  uploadStep2.style.display = 'block';
  uploadModalTitle.textContent = type === 'image' ? 'Preview & Publish Image' : 'Preview & Publish Video';
  confirmUploadBtn.disabled = false;
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
    uploadModalOverlay.style.display = 'none';
    resetPublishModal();
  });
}

// Close on overlay click
if (uploadModalOverlay) {
  uploadModalOverlay.addEventListener('click', (e) => {
    if (e.target === uploadModalOverlay) {
      uploadModalOverlay.style.display = 'none';
      resetPublishModal();
    }
  });
}

// Confirm publish — works locally without a server
if (confirmUploadBtn) {
  confirmUploadBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    const title = uploadTitle.value.trim() || 'Untitled Publication';
    const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'video';

    confirmUploadBtn.disabled = true;
    confirmUploadBtn.textContent = 'Publishing...';

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target.result;
      const item = {
        title,
        fileType,
        fileUrl,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const stored = JSON.parse(localStorage.getItem('talex_published') || '[]');
      stored.unshift(item);
      localStorage.setItem('talex_published', JSON.stringify(stored));

      showToast('Published successfully! 🎉', 'success');
      uploadModalOverlay.style.display = 'none';
      resetPublishModal();
      confirmUploadBtn.textContent = 'Publish';
      renderPublishedItems(stored);
    };
    reader.readAsDataURL(selectedFile);
  });
}

// Load published content from localStorage
function fetchPublishedContent() {
  if (!publishedGrid) return;
  const stored = JSON.parse(localStorage.getItem('talex_published') || '[]');
  if (stored.length > 0) {
    if (emptyPublished) emptyPublished.style.display = 'none';
    renderPublishedItems(stored);
  }
}

function renderPublishedItems(items) {
  // Remove existing cards
  publishedGrid.querySelectorAll('.published-card').forEach(c => c.remove());

  if (items.length === 0) {
    if (emptyPublished) emptyPublished.style.display = 'block';
    return;
  }

  if (emptyPublished) emptyPublished.style.display = 'none';

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'published-card';
    card.dataset.index = index;

    let mediaHtml = '';
    if (item.fileType === 'image') {
      mediaHtml = `<img src="${item.fileUrl}" alt="${item.title}">`;
    } else {
      mediaHtml = `<video src="${item.fileUrl}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
    }

    const date = new Date(item.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    const typeLabel = item.fileType === 'image' ? '🖼️ Image' : '🎬 Video';

    card.innerHTML = `
      <div class="pub-media">${mediaHtml}</div>
      <div class="pub-info">
        <h4>${item.title}</h4>
        <span class="pub-meta">${typeLabel} · ${date}</span>
      </div>
      <button class="pub-delete-btn" title="Delete">🗑 Delete</button>
    `;

    // Delete button handler
    card.querySelector('.pub-delete-btn').addEventListener('click', () => {
      if (!confirm(`Delete "${item.title}"?`)) return;
      const stored = JSON.parse(localStorage.getItem('talex_published') || '[]');
      stored.splice(index, 1);
      localStorage.setItem('talex_published', JSON.stringify(stored));
      card.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        card.remove();
        if (publishedGrid.querySelectorAll('.published-card').length === 0) {
          if (emptyPublished) emptyPublished.style.display = 'block';
        }
        showToast('Content deleted', 'success');
      }, 300);
    });

    publishedGrid.appendChild(card);
  });
}

// Load on page start
fetchPublishedContent();

// ════════════════════════════════════════
// NOTIFICATION SYSTEM LOGIC
// ════════════════════════════════════════

const notifBtn = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');
const notifList = document.getElementById('notifList');
const notifBadge = document.getElementById('notifBadge');
const notifCount = document.getElementById('notifCount');

let notificationsData = [];

// Toggle dropdown
if (notifBtn) {
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (notifDropdown) {
      notifDropdown.classList.toggle('open');
      if (notifDropdown.classList.contains('open')) {
        fetchNotifications();
      }
    }
  });
}

// Close on click outside
document.addEventListener('click', (e) => {
  if (notifDropdown && !notifDropdown.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
    notifDropdown.classList.remove('open');
  }
});

// Fetch Notifications
async function fetchNotifications() {
  try {
    const res = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('talex_token')}`
      }
    });
    const data = await res.json();
    if (data.success) {
      notificationsData = data.notifications;
      renderNotifications();
      updateNotifBadge();
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
}

function renderNotifications() {
  if (!notifList) return;

  if (notificationsData.length === 0) {
    notifList.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }

  notifList.innerHTML = notificationsData.map(n => {
    const time = formatTime(n.createdAt);
    return `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}" onclick="markNotificationAsRead('${n._id}')">
        <div class="notif-title">
          ${n.title}
        </div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${time}</div>
      </div>
    `;
  }).join('');
}

// Renamed to avoid collision with potential global markAsRead
window.markNotificationAsRead = async function(id) {
  try {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('talex_token')}`
      }
    });
    const data = await res.json();
    if (data.success) {
      // Update local data and re-render
      notificationsData = notificationsData.map(n => n._id === id ? { ...n, isRead: true } : n);
      renderNotifications();
      updateNotifBadge();
    }
  } catch (err) {
    console.error('Error marking as read:', err);
  }
};

function updateNotifBadge() {
  if (!notifBadge || !notifCount) return;
  const unreadCount = notificationsData.filter(n => !n.isRead).length;
  if (unreadCount > 0) {
    notifBadge.textContent = unreadCount;
    notifBadge.classList.add('visible');
    notifCount.textContent = `${unreadCount} New`;
  } else {
    notifBadge.classList.remove('visible');
    notifCount.textContent = '0 New';
  }
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return date.toLocaleDateString();
}

// Initial fetch to show badge on load
if (sessionStorage.getItem('talex_token')) {
  fetchNotifications();
}


// ── Toast helper ──
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '30px', right: '30px',
    padding: '12px 24px', borderRadius: '10px',
    background: type === 'success' ? '#10b981' : '#ef4444',
    color: '#fff', fontWeight: '600', zIndex: '10000',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s'
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
