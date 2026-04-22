// ===== TALEX Frontend — API Integration =====
const API_BASE = window.location.origin + '/api';
let authToken = localStorage.getItem('talex_token');
let currentUser = JSON.parse(localStorage.getItem('talex_user') || 'null');

// ===== UTILITY FUNCTIONS =====
async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    throw err;
  }
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

function updateAuthUI() {
  const navLinks = document.getElementById('navLinks');
  const ctaBtn = navLinks.querySelector('.nav-cta');
  if (currentUser) {
    ctaBtn.textContent = `Hi, ${currentUser.name.split(' ')[0]} (${currentUser.credits || 0} ⚡)`;
    ctaBtn.onclick = (e) => { e.preventDefault(); showUserMenu(); };
  } else {
    ctaBtn.textContent = 'Get Started Free';
    ctaBtn.onclick = (e) => { e.preventDefault(); showAuthModal('signup'); };
  }
}

// ===== AUTH MODAL =====
function showAuthModal(mode = 'signup') {
  const existing = document.getElementById('authModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <h2>${mode === 'signup' ? 'Create Your TALEX Account' : 'Welcome Back'}</h2>
      <p class="modal-sub">${mode === 'signup' ? 'Start your skill journey today' : 'Log in to continue learning'}</p>
      <form id="authForm">
        ${mode === 'signup' ? '<input type="text" name="name" placeholder="Full Name" required>' : ''}
        <input type="email" name="email" placeholder="Email Address" required>
        <input type="password" name="password" placeholder="Password" required minlength="6">
        <button type="submit" class="btn-primary">${mode === 'signup' ? 'Create Account →' : 'Log In →'}</button>
      </form>
      <p class="modal-switch">
        ${mode === 'signup'
          ? 'Already have an account? <a href="#" onclick="showAuthModal(\'login\')">Log In</a>'
          : 'Need an account? <a href="#" onclick="showAuthModal(\'signup\')">Sign Up</a>'}
      </p>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const body = Object.fromEntries(form);
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Please wait...';
    try {
      const data = await apiCall(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('talex_token', authToken);
      localStorage.setItem('talex_user', JSON.stringify(currentUser));
      closeModal();
      updateAuthUI();
      showToast(data.message);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = mode === 'signup' ? 'Create Account →' : 'Log In →';
    }
  });
}

function showUserMenu() {
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }
  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <strong>${currentUser.name}</strong>
      <span>${currentUser.email}</span>
      <span class="credits">⚡ ${currentUser.credits || 0} Credits</span>
    </div>
    <a href="#" onclick="viewMyCourses()">📚 My Courses</a>
    <a href="#" onclick="logout()">🚪 Log Out</a>
  `;
  document.querySelector('.navbar .container').appendChild(menu);
  setTimeout(() => document.addEventListener('click', function handler(e) {
    if (!e.target.closest('#userMenu') && !e.target.closest('.nav-cta')) {
      menu.remove();
      document.removeEventListener('click', handler);
    }
  }), 100);
}

function closeModal() {
  const modal = document.getElementById('authModal');
  if (modal) { modal.classList.remove('show'); setTimeout(() => modal.remove(), 300); }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('talex_token');
  localStorage.removeItem('talex_user');
  updateAuthUI();
  showToast('Logged out successfully');
  const menu = document.getElementById('userMenu');
  if (menu) menu.remove();
}

// ===== HERO FORM → SIGNUP =====
const heroForm = document.querySelector('.hero-form');
if (heroForm) {
  heroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('heroEmail').value;
    const password = document.getElementById('heroPass').value;
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    // Pre-fill auth modal with hero form data
    showAuthModal('signup');
    setTimeout(() => {
      const form = document.getElementById('authForm');
      if (form) {
        const emailInput = form.querySelector('[name="email"]');
        const passInput = form.querySelector('[name="password"]');
        if (emailInput) emailInput.value = email;
        if (passInput) passInput.value = password;
      }
    }, 100);
  });
}

// ===== LOAD COURSES FROM API =====
async function loadCourses(filter = 'all') {
  try {
    const params = filter !== 'all' ? `?category=${filter}` : '';
    const data = await apiCall(`/courses${params}`);
    renderCourses(data.courses);
  } catch (err) {
    console.error('Failed to load courses:', err);
  }
}

function renderCourses(coursesData) {
  const grid = document.querySelector('.course-grid');
  if (!grid) return;

  grid.innerHTML = coursesData.map(course => `
    <div class="course-card reveal visible" data-category="${course.category}" data-id="${course._id}">
      <div class="course-thumb">
        <img src="${course.thumbnail}" alt="${course.title}">
        <span class="course-tag ${course.tags?.includes('badge') ? 'best' : course.tags?.includes('new') ? 'new' : 'hot'}">
          ${course.tags?.includes('badge') ? '🏅 Badge' : course.tags?.includes('new') ? 'New' : 'Hot'}
        </span>
      </div>
      <div class="course-info">
        <h3>${course.title}</h3>
        <div class="instructor"><span class="dot"></span> ${course.instructorName} · ${course.credits} Credits</div>
        <button class="btn-enroll" onclick="enrollCourse('${course._id}')">Enroll Now</button>
      </div>
    </div>
  `).join('');
}

async function enrollCourse(courseId) {
  if (!authToken) {
    showToast('Please log in to enroll', 'error');
    showAuthModal('login');
    return;
  }
  try {
    const data = await apiCall('/enroll', { method: 'POST', body: JSON.stringify({ courseId }) });
    currentUser.credits = data.remainingCredits;
    currentUser.enrolledCourses = data.enrolledCourses;
    localStorage.setItem('talex_user', JSON.stringify(currentUser));
    updateAuthUI();
    showToast(data.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewMyCourses() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.remove();
  try {
    const data = await apiCall('/enroll/my-courses');
    if (data.courses.length === 0) {
      showToast('You haven\'t enrolled in any courses yet!', 'error');
      return;
    }
    // Scroll to courses and show only enrolled
    document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    renderCourses(data.courses);
    showToast(`Showing your ${data.courses.length} enrolled course(s)`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== LOAD INSTRUCTORS FROM API =====
async function loadInstructors() {
  try {
    const data = await apiCall('/instructors');
    renderInstructors(data.instructors);
  } catch (err) {
    console.error('Failed to load instructors:', err);
  }
}

function renderInstructors(instructorsData) {
  const grid = document.querySelector('.instructor-grid');
  if (!grid) return;
  grid.innerHTML = instructorsData.map(inst => `
    <div class="instructor-card reveal visible">
      <div class="instructor-avatar" style="background:${inst.gradient}">${inst.avatar}</div>
      <h4>${inst.name}</h4>
      <p>${inst.role}</p>
    </div>
  `).join('');
}

// ===== LOAD TESTIMONIALS FROM API =====
async function loadTestimonials() {
  try {
    const data = await apiCall('/testimonials');
    renderTestimonials(data.testimonials);
  } catch (err) {
    console.error('Failed to load testimonials:', err);
  }
}

function renderTestimonials(testimonialsData) {
  const grid = document.querySelector('.testimonial-grid');
  if (!grid) return;
  grid.innerHTML = testimonialsData.map(t => `
    <div class="testimonial-card reveal visible">
      <div class="stars">${'★'.repeat(t.rating)}</div>
      <blockquote>"${t.review}"</blockquote>
      <div class="testimonial-author">
        <div class="testimonial-avatar" style="background:${t.gradient}">${t.avatar}</div>
        <div>
          <h5>${t.name}</h5>
          <span>${t.role}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== MOBILE NAV =====
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn?.addEventListener('click', () => navLinks.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!e.target.closest('.navbar')) navLinks.classList.remove('open');
});

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
reveals.forEach(el => revealObserver.observe(el));

// ===== COURSE FILTER TABS =====
const tabs = document.querySelectorAll('.filter-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    loadCourses(filter);
  });
});

// ===== FAQ ACCORDION =====
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const question = item.querySelector('.faq-q');
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    faqItems.forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ===== ANIMATED COUNTER =====
const statNums = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const isFloat = String(target).includes('.');
      const duration = 2000;
      const startTime = performance.now();
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => counterObserver.observe(el));

// ===== NAVBAR SCROLL =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.background = window.scrollY > 50 ? 'rgba(10,10,15,.95)' : 'rgba(10,10,15,.85)';
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== INIT ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  // Try loading from API (graceful fallback if server not running)
  loadCourses().catch(() => console.log('[TALEX] API not available — using static content'));
  loadInstructors().catch(() => console.log('[TALEX] Instructors API not available'));
  loadTestimonials().catch(() => console.log('[TALEX] Testimonials API not available'));
});

// Inject dynamic styles
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

  /* Toast */
  .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(100px);padding:14px 28px;border-radius:12px;color:#fff;font-weight:600;font-size:.9rem;z-index:10000;transition:transform .4s ease;box-shadow:0 10px 30px rgba(0,0,0,.4)}
  .toast-success{background:linear-gradient(135deg,#00d4aa,#00b894)}
  .toast-error{background:linear-gradient(135deg,#ef4444,#dc2626)}
  .toast.show{transform:translateX(-50%) translateY(0)}

  /* Modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}
  .modal-overlay.show{opacity:1}
  .modal-box{background:#151521;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px;max-width:440px;width:90%;position:relative}
  .modal-close{position:absolute;top:16px;right:16px;background:none;color:#888;font-size:1.5rem;cursor:pointer;transition:color .3s}
  .modal-close:hover{color:#fff}
  .modal-box h2{font-size:1.5rem;font-weight:800;margin-bottom:8px}
  .modal-sub{color:#8888a0;margin-bottom:24px;font-size:.9rem}
  .modal-box input{width:100%;padding:14px 18px;border-radius:10px;background:#1a1a2e;border:1px solid rgba(255,255,255,.08);color:#fff;font-size:.9rem;margin-bottom:12px;transition:border-color .3s}
  .modal-box input:focus{border-color:#00d4aa;outline:none}
  .btn-primary{width:100%;padding:14px;border-radius:10px;background:linear-gradient(135deg,#00d4aa,#00b894);color:#000;font-weight:700;font-size:1rem;cursor:pointer;border:none;transition:transform .3s,box-shadow .3s;margin-top:4px}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,212,170,.3)}
  .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .modal-switch{text-align:center;margin-top:20px;color:#8888a0;font-size:.85rem}
  .modal-switch a{color:#00d4aa;font-weight:600}

  /* User Menu */
  .user-menu{position:absolute;top:65px;right:24px;background:#151521;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:8px;min-width:220px;box-shadow:0 20px 50px rgba(0,0,0,.5);z-index:1001}
  .user-menu-header{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:4px}
  .user-menu-header strong{display:block;font-size:.95rem}
  .user-menu-header span{display:block;font-size:.8rem;color:#8888a0}
  .user-menu-header .credits{color:#00d4aa;font-weight:600;margin-top:4px}
  .user-menu a{display:block;padding:10px 16px;border-radius:8px;font-size:.9rem;color:#e2e2f0;transition:background .2s}
  .user-menu a:hover{background:rgba(255,255,255,.06)}

  /* Enroll Button */
  .btn-enroll{width:100%;padding:10px;border-radius:8px;background:linear-gradient(135deg,#00d4aa,#00b894);color:#000;font-weight:700;font-size:.85rem;cursor:pointer;border:none;margin-top:12px;transition:transform .3s,box-shadow .3s}
  .btn-enroll:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,212,170,.3)}
`;
document.head.appendChild(dynamicStyles);
