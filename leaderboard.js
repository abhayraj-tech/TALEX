/**
 * TALEX Leaderboard — Client Logic
 * Fetches leaderboard data, renders podium + table, handles detail modal.
 */
(function () {
  'use strict';

  const API = '/api/leaderboard';
  let allStudents = [];

  // ── DOM refs ──
  const loader = document.getElementById('loader');
  const podiumSection = document.getElementById('podiumSection');
  const podiumGrid = document.getElementById('podiumGrid');
  const tableSection = document.getElementById('tableSection');
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    bindEvents();
  });

  // ── Fetch ──
  async function fetchLeaderboard() {
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (json.success && json.data) {
        allStudents = json.data;
        render(allStudents);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      loader.innerHTML = '<p style="color:#e11d48;">Failed to load leaderboard data.</p>';
    }
  }

  // ── Render ──
  function render(students) {
    loader.style.display = 'none';
    renderPodium(students.slice(0, 3));
    renderTable(students);
    podiumSection.style.display = '';
    tableSection.style.display = '';
  }

  // ── Podium ──
  function renderPodium(top3) {
    const classes = ['gold', 'silver', 'bronze'];
    const medals = ['🥇', '🥈', '🥉'];
    podiumGrid.innerHTML = top3.map((s, i) => `
      <div class="podium-card ${classes[i]}" data-id="${s.student_id}" onclick="window._openModal('${s.student_id}')">
        <div class="podium-rank">${medals[i]}</div>
        <div class="podium-avatar" style="background:${s.gradient}">${s.avatar}</div>
        <div class="podium-name">${s.name}</div>
        <div class="podium-tier">${s.rank_emoji} ${s.rank_tier}</div>
        <div class="podium-score" data-target="${s.composite_score}">0</div>
        <div class="podium-score-label">Points</div>
      </div>
    `).join('');

    // Animate scores
    setTimeout(() => {
      podiumGrid.querySelectorAll('.podium-score').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
    }, 200);
  }

  // ── Table ──
  function renderTable(students) {
    tableBody.innerHTML = students.map((s, i) => {
      const tierClass = s.rank_tier.toLowerCase();
      const rankClass = i < 3 ? `top${i + 1}` : '';
      const bd = s.score_breakdown;
      const bars = [
        { cls: 'ps', val: bd.problem_solving, max: 300 },
        { cls: 'tp', val: bd.test_performance, max: 250 },
        { cls: 'cs', val: bd.consistency, max: 200 },
        { cls: 'bg', val: bd.badges, max: 100 },
        { cls: 'cm', val: bd.community, max: 100 },
        { cls: 'im', val: bd.improvement, max: 50 }
      ];

      return `
        <tr onclick="window._openModal('${s.student_id}')">
          <td class="rank-cell ${rankClass}">#${i + 1}</td>
          <td>
            <div class="student-cell">
              <div class="student-avatar" style="background:${s.gradient}">${s.avatar}</div>
              <div>
                <div class="student-name">${s.name}</div>
                <div class="student-id">${s.student_id}</div>
              </div>
            </div>
          </td>
          <td class="score-cell">${s.composite_score}</td>
          <td><span class="tier-badge ${tierClass}">${s.rank_emoji} ${s.rank_tier}</span></td>
          <td>
            <div class="breakdown-bars">
              ${bars.map(b => `<div class="mini-bar ${b.cls}" style="height:${(b.val / b.max) * 32}px" title="${b.cls.toUpperCase()}: ${b.val}"></div>`).join('')}
            </div>
          </td>
          <td class="trend-cell trend-up">${s.leaderboard_position_estimate}</td>
        </tr>
      `;
    }).join('');
  }

  // ── Modal ──
  window._openModal = async function (studentId) {
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Find from cached data first
    let student = allStudents.find(s => s.student_id === studentId);

    // Or fetch fresh
    if (!student) {
      try {
        const res = await fetch(`${API}/${studentId}`);
        const json = await res.json();
        if (json.success) student = json.data;
      } catch (e) { console.error(e); }
    }

    if (!student) return;
    renderModal(student);
  };

  function renderModal(s) {
    // Header
    document.getElementById('modalAvatar').textContent = s.avatar;
    document.getElementById('modalAvatar').style.background = s.gradient;
    document.getElementById('modalName').textContent = s.name;
    document.getElementById('modalId').textContent = s.student_id;

    // Score ring
    const pct = (s.composite_score / 1000) * 100;
    const deg = (pct / 100) * 360;
    const ring = document.getElementById('scoreRing');
    ring.style.background = `conic-gradient(#06b6d4 0deg, #14b8a6 ${deg}deg, #0f172a ${deg}deg)`;
    animateCounter(document.getElementById('scoreValue'), s.composite_score);

    // Tier
    document.getElementById('tierEmoji').textContent = s.rank_emoji;
    document.getElementById('tierName').textContent = s.rank_tier;
    document.getElementById('positionBadge').textContent = s.leaderboard_position_estimate;

    // Company score
    const cs = s.company_recommendation;
    document.getElementById('companyBarFill').style.width = cs.score + '%';
    animateCounter(document.getElementById('companyScoreVal'), cs.score);

    // Breakdown grid
    const bd = s.score_breakdown;
    const dims = [
      { key: 'problem_solving', label: 'Problem Solving', max: 300, cls: 'ps' },
      { key: 'test_performance', label: 'Test Performance', max: 250, cls: 'tp' },
      { key: 'consistency', label: 'Consistency', max: 200, cls: 'cs' },
      { key: 'badges', label: 'Badges', max: 100, cls: 'bg' },
      { key: 'community', label: 'Community', max: 100, cls: 'cm' },
      { key: 'improvement', label: 'Improvement', max: 50, cls: 'im' }
    ];

    document.getElementById('breakdownGrid').innerHTML = dims.map(d => {
      const val = bd[d.key];
      const pct = (val / d.max) * 100;
      return `
        <div class="breakdown-item">
          <div class="b-label">${d.label}</div>
          <div class="b-value b-${d.cls}">${val}</div>
          <div class="b-max">/ ${d.max}</div>
          <div class="b-bar"><div class="b-bar-fill" style="width:${pct}%;background:var(--${d.cls === 'ps' ? 'cyan' : d.cls === 'tp' ? 'teal' : d.cls === 'cs' ? 'purple' : d.cls === 'bg' ? 'amber' : d.cls === 'cm' ? 'rose' : 'teal'})"></div></div>
        </div>
      `;
    }).join('');

    // Pitch
    document.getElementById('pitchText').textContent = cs.recruiter_pitch;

    // Strengths
    document.getElementById('strengthsList').innerHTML = s.strengths.map(st => `<li>✅ ${st}</li>`).join('');

    // Improvements
    document.getElementById('improveList').innerHTML = s.improve.map(im => `<li>🎯 ${im}</li>`).join('');

    // Next badge
    document.getElementById('nextBadge').querySelector('span').textContent = s.next_badge_suggestion;
  }

  // ── Events ──
  function bindEvents() {
    // Close modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Search
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allStudents.filter(s => s.name.toLowerCase().includes(q) || s.student_id.includes(q) || s.rank_tier.toLowerCase().includes(q));
      renderTable(filtered);
    });

    // Filter pills
    document.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        if (filter === 'all') {
          renderTable(allStudents);
        } else {
          const filtered = allStudents.filter(s => s.rank_tier.toLowerCase() === filter);
          renderTable(filtered);
        }
      });
    });
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Animate Counter ──
  function animateCounter(el, target) {
    const duration = 1200;
    const start = performance.now();
    const initial = 0;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(initial + (target - initial) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
})();
