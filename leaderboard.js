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
    console.log('🏆 Leaderboard Initializing...');
    fetchLeaderboard();
    bindEvents();
  });

  // ── Fetch ──
  async function fetchLeaderboard() {
    try {
      console.log('📡 Fetching from:', API);
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        console.log('✅ API data loaded:', json.data.length, 'students');
        allStudents = json.data;
        render(allStudents);
      } else {
        console.warn('⚠️ API returned empty or invalid data, falling back.');
        loadFallback();
      }
    } catch (err) {
      console.error('❌ API Fetch Failed:', err);
      loadFallback();
    }
  }

  function loadFallback() {
    console.log('📦 Loading fallback leaderboard data...');
    const fallbackData = [
      {"student_id":"LB-001","name":"Abhay Raj","avatar":"AR","gradient":"linear-gradient(135deg,#06b6d4,#0891b2)","composite_score":955,"rank_tier":"Grandmaster","rank_emoji":"🏆","score_breakdown":{"problem_solving":295,"test_performance":245,"consistency":195,"badges":100,"community":85,"improvement":35},"leaderboard_position_estimate":"Top 1%","company_recommendation":{"score":98,"recruiter_pitch":"Abhay is a phenomenal performer with near-perfect consistency and technical depth. A standout candidate for any senior engineering role."},"strengths":["Perfect Problem Solving score","Active 90+ day streak","Top 1% Global Rank"],"improve":["N/A"],"next_badge_suggestion":"Ultimate Master","raw_data":{}},
      {"student_id":"LB-002","name":"Emily Davis","avatar":"ED","gradient":"linear-gradient(135deg,#ec4899,#db2777)","composite_score":841,"rank_tier":"Diamond","rank_emoji":"💎","score_breakdown":{"problem_solving":178,"test_performance":248,"consistency":200,"badges":100,"community":85,"improvement":30},"leaderboard_position_estimate":"Top 10%","company_recommendation":{"score":83,"recruiter_pitch":"Emily is an elite performer ranked Diamond with a 95% accuracy rate across 250+ problems."},"strengths":["Test Performance: 99%","30-day current streak"],"improve":["Increase hard problem attempts"],"next_badge_suggestion":"Gold Streak Master","raw_data":{}},
      {"student_id":"LB-003","name":"Olivia Patel","avatar":"OP","gradient":"linear-gradient(135deg,#f43f5e,#e11d48)","composite_score":743,"rank_tier":"Platinum","rank_emoji":"🥇","score_breakdown":{"problem_solving":162,"test_performance":242,"consistency":167,"badges":80,"community":64,"improvement":28},"leaderboard_position_estimate":"Top 20%","company_recommendation":{"score":72,"recruiter_pitch":"Olivia demonstrates strong technical skills with consistent growth trajectory."},"strengths":["Consistency: 29/30 active days","97% Test average"],"improve":["Try higher difficulty tiers"],"next_badge_suggestion":"Silver Problem Solver","raw_data":{}},
      {"student_id":"LB-004","name":"Alex Mercer","avatar":"AM","gradient":"linear-gradient(135deg,#00d4aa,#00b894)","composite_score":695,"rank_tier":"Platinum","rank_emoji":"🥇","score_breakdown":{"problem_solving":145,"test_performance":242,"consistency":150,"badges":80,"community":53,"improvement":25},"leaderboard_position_estimate":"Top 30%","company_recommendation":{"score":66,"recruiter_pitch":"Alex is a reliable candidate ready for challenging roles."},"strengths":["Recency trend: High","28/30 active days"],"improve":["Increase hard problem solved"],"next_badge_suggestion":"Silver Streak Builder","raw_data":{}},
      {"student_id":"LB-005","name":"Jessica Wong","avatar":"JW","gradient":"linear-gradient(135deg,#10b981,#059669)","composite_score":593,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":128,"test_performance":226,"consistency":128,"badges":45,"community":44,"improvement":22},"leaderboard_position_estimate":"Top 40%","company_recommendation":{"score":58,"recruiter_pitch":"Jessica is a growing talent with solid fundamentals."},"strengths":["90% Test average","12-day streak"],"improve":["Improvement momentum plateauing"],"next_badge_suggestion":"Bronze Explorer","raw_data":{}},
      {"student_id":"LB-006","name":"Sarah Chen","avatar":"SC","gradient":"linear-gradient(135deg,#7c3aed,#6d28d9)","composite_score":549,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":114,"test_performance":220,"consistency":114,"badges":45,"community":38,"improvement":18},"leaderboard_position_estimate":"Top 50%","company_recommendation":{"score":52,"recruiter_pitch":"Sarah shows promising potential with room for rapid advancement."},"strengths":["Consistency: 24/30 active days","2 badges earned"],"improve":["Community engagement is low"],"next_badge_suggestion":"Bronze Explorer","raw_data":{}},
      {"student_id":"LB-007","name":"Sophia Lee","avatar":"SL","gradient":"linear-gradient(135deg,#14b8a6,#0d9488)","composite_score":518,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":105,"test_performance":218,"consistency":107,"badges":35,"community":33,"improvement":20},"leaderboard_position_estimate":"Top 60%","company_recommendation":{"score":50,"recruiter_pitch":"Sophia has solid fundamentals and a 20% improvement rate."},"strengths":["87% Test average","20% Improvement rate"],"improve":["Earn more badges"],"next_badge_suggestion":"Silver Streak Builder","raw_data":{}},
      {"student_id":"LB-008","name":"Ryan Johnson","avatar":"RJ","gradient":"linear-gradient(135deg,#8b5cf6,#7c3aed)","composite_score":483,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":91,"test_performance":214,"consistency":100,"badges":30,"community":29,"improvement":19},"leaderboard_position_estimate":"Top 70%","company_recommendation":{"score":47,"recruiter_pitch":"Ryan demonstrates good potential for junior roles."},"strengths":["Consistency: 22/30 active days","Solid foundations"],"improve":["Join discussions"],"next_badge_suggestion":"Bronze Explorer","raw_data":{}},
      {"student_id":"LB-009","name":"David Kim","avatar":"DK","gradient":"linear-gradient(135deg,#3b82f6,#2563eb)","composite_score":421,"rank_tier":"Silver","rank_emoji":"🥉","score_breakdown":{"problem_solving":84,"test_performance":198,"consistency":83,"badges":20,"community":24,"improvement":12},"leaderboard_position_estimate":"Top 80%","company_recommendation":{"score":40,"recruiter_pitch":"David is building a solid base in problem solving."},"strengths":["20 hard problems solved","82% accuracy"],"improve":["Try new categories"],"next_badge_suggestion":"Silver Streak Builder","raw_data":{}},
      {"student_id":"LB-010","name":"Michael Torres","avatar":"MT","gradient":"linear-gradient(135deg,#f59e0b,#d97706)","composite_score":323,"rank_tier":"Silver","rank_emoji":"🥉","score_breakdown":{"problem_solving":59,"test_performance":183,"consistency":58,"badges":5,"community":10,"improvement":8},"leaderboard_position_estimate":"Top 100%","company_recommendation":{"score":30,"recruiter_pitch":"Michael is an early-stage learner actively building foundations."},"strengths":["78% accuracy","Growing fundamentals"],"improve":["Earn more achievement badges"],"next_badge_suggestion":"Bronze Explorer","raw_data":{}}
    ];
    allStudents = fallbackData;
    render(allStudents);
  }

  // ── Render ──
  function render(students) {
    if (!students || students.length === 0) {
      console.warn('Empty student list provided to render.');
      return;
    }
    
    loader.style.display = 'none';
    renderPodium(students.slice(0, 3));
    renderTable(students);
    
    podiumSection.style.display = 'block';
    tableSection.style.display = 'block';
    console.log('✨ Leaderboard Render Complete');
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
      const tierClass = (s.rank_tier || 'unranked').toLowerCase();
      const rankClass = i < 3 ? `top${i + 1}` : '';
      const bd = s.score_breakdown || { problem_solving:0, test_performance:0, consistency:0, badges:0, community:0, improvement:0 };
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
    document.getElementById('strengthsList').innerHTML = (s.strengths || []).map(st => `<li>✅ ${st}</li>`).join('');

    // Improvements
    document.getElementById('improveList').innerHTML = (s.improve || []).map(im => `<li>🎯 ${im}</li>`).join('');

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
      const filtered = allStudents.filter(s => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.rank_tier.toLowerCase().includes(q));
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
    const initial = parseInt(el.textContent) || 0;

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