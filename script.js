// ===== TALEX Frontend — API Integration =====
const isLocalhost = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
const isFile = window.location.origin.includes('file:') || window.location.origin === 'null';
const API_BASE = (isLocalhost || isFile) ? 'http://localhost:5000/api' : window.location.origin + '/api';
// Clear any stale demo tokens so nobody is auto-logged in
(function clearDemoSession() {
  const t = localStorage.getItem('talex_token');
  if (!t || t === 'demo-token') {
    localStorage.removeItem('talex_token');
    localStorage.removeItem('talex_user');
  }
})();

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
  const logoutBtn = document.getElementById('navLogout');
  
  if (currentUser) {
    ctaBtn.textContent = `Hi, ${currentUser.name.split(' ')[0]} (${currentUser.credits || 0} ⚡)`;
    ctaBtn.style.cursor = 'pointer';
    ctaBtn.title = 'Go to Dashboard';
    ctaBtn.onclick = (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; };
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    ctaBtn.textContent = 'Get Started Free';
    ctaBtn.onclick = (e) => { e.preventDefault(); showAuthModal('signup'); };
    if (logoutBtn) logoutBtn.style.display = 'none';
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
    const rect = btn.getBoundingClientRect();
    const btnX = rect.left + rect.width / 2;
    const btnY = rect.top + rect.height / 2;

    try {
      const data = await apiCall(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('talex_token', authToken);
      localStorage.setItem('talex_user', JSON.stringify(currentUser));
    } catch (err) {
      console.warn('[Auth] Backend unavailable:', err.message);
      // Show error to user instead of auto-logging in
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
      showToast('Could not connect to server. Please try again.', 'error');
      return;
    }

    updateAuthUI();
    // Trigger water ripple effect
    triggerRipple(btnX, btnY);
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

// ===== 🔥 CINEMATIC CENTER-TEAR PORTAL ANIMATION =====
// ===== 🔥 WATER RIPPLE TELEPORTATION ANIMATION =====
function spawnRipple(x, y, delay, size, color, borderWidth) {
  const rippleLayer = document.getElementById('ripple-layer');
  if (!rippleLayer) return null;
  const el = document.createElement('div');
  el.className = 'ripple-ring';
  const diameter = size;
  Object.assign(el.style, {
    left: x + 'px',
    top: y + 'px',
    width: diameter + 'px',
    height: diameter + 'px',
    border: `${borderWidth}px solid ${color}`,
    boxShadow: `0 0 ${borderWidth * 6}px ${color}, inset 0 0 ${borderWidth * 3}px ${color}`,
    animationDelay: delay + 'ms',
    animationDuration: '700ms',
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    animationFillMode: 'both',
    animationName: 'rippleExpand',
    filter: 'blur(0.4px)'
  });
  rippleLayer.appendChild(el);
  return el;
}

function triggerRipple(x, y) {
  const overlay = document.getElementById('overlay');
  const rippleLayer = document.getElementById('ripple-layer');
  if (!overlay || !rippleLayer) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Hide the modal slowly so it fades behind the dimming overlay
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('show');

  // Dim + shrink body
  overlay.classList.add('dimming');
  document.body.classList.add('shrink-active');

  const W = window.innerWidth;
  const H = window.innerHeight;
  const maxD = Math.sqrt(W * W + H * H) * 2.2;

  // Wave rings (Cinematic Teal/Cyan Portal)
  const rings = [
    { delay: 0,   size: maxD * 0.2,  color: 'rgba(0,255,220,1)',    bw: 3.5 },
    { delay: 30,  size: maxD * 0.4,  color: 'rgba(0,255,200,0.8)',  bw: 2.5 },
    { delay: 70,  size: maxD * 0.65, color: 'rgba(0,255,180,0.5)',  bw: 1.8 },
    { delay: 130, size: maxD * 0.9,  color: 'rgba(0,255,160,0.3)',  bw: 1.2 },
    { delay: 210, size: maxD * 1.2,  color: 'rgba(0,255,150,0.1)',  bw: 0.8 }
  ];

  rings.forEach(r => spawnRipple(x, y, r.delay, r.size, r.color, r.bw));

  // Radial fill wash
  let fillStart = null;
  const fillDuration = 550;
  const fillCanvas = document.createElement('canvas');
  fillCanvas.width = W; fillCanvas.height = H;
  Object.assign(fillCanvas.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '0'
  });
  rippleLayer.appendChild(fillCanvas);
  const fc = fillCanvas.getContext('2d');

  function animateFill(ts) {
    if (!fillStart) fillStart = ts;
    const p = Math.min((ts - fillStart) / fillDuration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const radius = (maxD / 2) * eased;
    fc.clearRect(0, 0, W, H);
    const g = fc.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(0,20,16,${0.72 * eased})`);
    g.addColorStop(0.6, `rgba(0,30,22,${0.4 * eased})`);
    g.addColorStop(1, 'transparent');
    fc.fillStyle = g;
    fc.fillRect(0, 0, W, H);
    if (p < 1) requestAnimationFrame(animateFill);
  }
  requestAnimationFrame(animateFill);

  // Navigate
  console.log('🚀 Redirecting to dashboard...');
  setTimeout(() => {
    window.location.assign('dashboard.html');
  }, 800);
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

  grid.innerHTML = coursesData.map(course => {
    const isEnrolled = currentUser && currentUser.enrolledCourses?.includes(course._id);
    return `
    <div class="course-card reveal visible" data-category="${course.category}" data-id="${course._id}" onclick="navigateTo('/course/${course._id}')" style="cursor: pointer;">
      <div class="course-thumb">
        <img src="${course.thumbnail}" alt="${course.title}">
        <span class="course-tag ${course.tags?.includes('badge') ? 'best' : course.tags?.includes('new') ? 'new' : 'hot'}">
          ${course.tags?.includes('badge') ? '🏅 Badge' : course.tags?.includes('new') ? 'New' : 'Hot'}
        </span>
      </div>
      <div class="course-info">
        <h3>${course.title}</h3>
        <div class="instructor"><span class="dot"></span> ${course.instructorName} · ${course.credits} Credits</div>
        <button class="btn-enroll ${isEnrolled ? 'enrolled' : ''}" onclick="event.stopPropagation(); enrollCourse('${course._id}')" ${isEnrolled ? 'disabled' : ''}>
          ${isEnrolled ? 'Enrolled ✓' : 'Enroll Now'}
        </button>
      </div>
    </div>
  `}).join('');
}

async function enrollCourse(courseId) {
  if (!authToken) {
    showToast('Please log in to enroll', 'error');
    showAuthModal('login');
    return;
  }
  const btn = document.querySelector(`.course-card[data-id="${courseId}"] .btn-enroll`);
  if (btn) { btn.disabled = true; btn.textContent = 'Enrolling...'; }
  try {
    const data = await apiCall('/enroll', { method: 'POST', body: JSON.stringify({ courseId }) });
    currentUser.credits = data.remainingCredits;
    currentUser.enrolledCourses = data.enrolledCourses;
    localStorage.setItem('talex_user', JSON.stringify(currentUser));
    updateAuthUI();
    showToast(data.message);
    if (btn) {
      btn.textContent = 'Enrolled ✓';
      btn.classList.add('enrolled');
    }
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Enroll Now'; }
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
  .btn-enroll.enrolled{background:transparent;border:1px solid #00d4aa;color:#00d4aa;cursor:default;box-shadow:none;opacity:0.8}
  .btn-enroll.enrolled:hover{transform:none;box-shadow:none}
`;
document.head.appendChild(dynamicStyles);

// Also add shrink-active body overflow control
const shrinkStyle = document.createElement('style');
shrinkStyle.textContent = `body.shrink-active { overflow: hidden; }`;
document.head.appendChild(shrinkStyle);

// ===== SPA ROUTING LOGIC =====
function navigateTo(path) {
  window.history.pushState({}, '', path);
  handleRoute();
}

window.addEventListener('popstate', handleRoute);

async function handleRoute() {
  const path = window.location.pathname;
  const landingView = document.getElementById('landing-view');
  const appView = document.getElementById('app-view');
  
  if (!landingView || !appView) return;

  if (path === '/' || path.includes('new.html') || path === '') {
    appView.style.display = 'none';
    landingView.style.display = 'block';
    window.scrollTo(0, 0);
    return;
  }
  
  landingView.style.display = 'none';
  appView.style.display = 'block';
  appView.innerHTML = '<div class="loader"></div><p class="text-center">Loading...</p>';
  window.scrollTo(0, 0);
  
  if (path.startsWith('/courses/')) {
    const category = path.split('/')[2];
    await renderCategoryView(category);
  } else if (path.startsWith('/course/')) {
    const id = path.split('/')[2];
    await renderCourseDetailView(id);
  } else {
    appView.innerHTML = '<div class="container text-center" style="padding:100px;"><h2>404 - Page Not Found</h2><br><a href="/" onclick="navigateTo(\'/\'); return false;" style="color:#00d4aa;text-decoration:none;">Go back home</a></div>';
  }
}

async function renderCategoryView(category) {
  const appView = document.getElementById('app-view');
  try {
    const data = await apiCall(`/courses?category=${category}`);
    const displayCategory = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    let html = `
      <div class="container">
        <div class="category-header">
          <h1>${displayCategory} Courses</h1>
          <p class="section-sub">Master new skills with our top-rated creators</p>
        </div>
        <div class="course-grid">
    `;
    
    if (data.courses.length === 0) {
      html += `<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">No courses found in this category yet.</div>`;
    } else {
      html += data.courses.map(course => {
        const isEnrolled = currentUser && currentUser.enrolledCourses?.includes(course._id);
        return `
        <div class="course-card reveal visible" data-id="${course._id}" onclick="navigateTo('/course/${course._id}')" style="cursor: pointer;">
          <div class="course-thumb">
            <img src="${window.location.origin}/${course.thumbnail}" alt="${course.title}" onerror="this.src='${course.thumbnail}'">
          </div>
          <div class="course-info">
            <h3>${course.title}</h3>
            <div class="instructor"><span class="dot"></span> ${course.instructorName} · ★ ${course.rating || '4.5'}</div>
            <button class="btn-enroll ${isEnrolled ? 'enrolled' : ''}" onclick="event.stopPropagation(); enrollCourse('${course._id}')" ${isEnrolled ? 'disabled' : ''}>
              ${isEnrolled ? 'Enrolled ✓' : 'Enroll Now'}
            </button>
          </div>
        </div>
        `;
      }).join('');
    }
    
    html += `</div></div>`;
    appView.innerHTML = html;
  } catch (err) {
    appView.innerHTML = `<div class="container text-center text-red">Failed to load courses. Please try again.</div>`;
  }
}

async function renderCourseDetailView(id) {
  const appView = document.getElementById('app-view');
  try {
    const data = await apiCall(`/courses/${id}`);
    const course = data.course;
    if (!course) throw new Error('Course not found');
    
    const isEnrolled = currentUser && currentUser.enrolledCourses?.includes(course._id);
    const skillsHtml = (course.skills || []).map(skill => `<span class="skill-badge">${skill}</span>`).join('');
    
    appView.innerHTML = `
      <div class="container">
        <div class="course-detail-hero">
          <button onclick="navigateTo('/courses/web-development')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-bottom: 20px;">← Back to Category</button>
          <div class="course-video-wrapper">
            <video src="${course.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}" controls poster="${window.location.origin}/${course.thumbnail}" onerror="this.poster='${course.thumbnail}'"></video>
          </div>
          <div class="course-meta-header">
            <div>
              <h1>${course.title}</h1>
              <div class="course-stats">
                <span>👤 ${course.instructor?.name || 'TALEX Creator'}</span>
                <span>⏱ ${course.duration || 'Flexible'}</span>
                <span>★ ${course.rating || '4.8'} Rating</span>
              </div>
              <div class="skills-container">${skillsHtml}</div>
            </div>
          </div>
        </div>
        
        <div class="course-body">
          <div class="course-description">
            <h3>Course Overview</h3>
            <p>${course.description}</p>
            <h3>What you will learn</h3>
            <ul>
              ${(course.skills || []).map(s => `<li style="margin-bottom: 10px; color: var(--text-secondary);">✓ Master ${s} fundamentals</li>`).join('')}
              <li style="margin-bottom: 10px; color: var(--text-secondary);">✓ Build real-world portfolio projects</li>
              <li style="margin-bottom: 10px; color: var(--text-secondary);">✓ Earn a verified TALEX skill badge</li>
            </ul>
          </div>
          
          <div class="course-sidebar">
            <div class="enroll-panel">
              <h3>Enrollment</h3>
              <div class="enroll-price">${course.credits} ⚡</div>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">Access to all video modules, project files, and community discord.</p>
              <button class="btn-enroll ${isEnrolled ? 'enrolled' : ''}" onclick="enrollCourse('${course._id}')" ${isEnrolled ? 'disabled' : ''} id="detailEnrollBtn">
                ${isEnrolled ? 'Enrolled ✓' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    appView.innerHTML = `<div class="container text-center text-red">Failed to load course details.</div>`;
  }
}

// Ensure handleRoute runs if someone loads a direct link to a subpage
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname !== '/' && !window.location.pathname.includes('new.html')) {
    handleRoute();
  }
});
