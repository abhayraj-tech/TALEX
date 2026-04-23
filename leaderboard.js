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
      if (!res.ok) throw new Error('API not available');
      const json = await res.json();
      if (json.success && json.data) {
        allStudents = json.data;
        render(allStudents);
      } else {
        throw new Error('Invalid data');
      }
    } catch (err) {
      console.warn('Failed to load leaderboard from API, using fallback data:', err);
      // Fallback data if server is not running
      const fallbackData = [{"student_id":"fallback-1","name":"Emily Davis","avatar":"ED","gradient":"linear-gradient(135deg,#ec4899,#db2777)","composite_score":841,"rank_tier":"Diamond","rank_emoji":"💎","score_breakdown":{"problem_solving":178,"test_performance":248,"consistency":200,"badges":100,"community":85,"improvement":30},"leaderboard_position_estimate":"Top 10%","company_recommendation":{"score":83,"recruiter_pitch":"Emily is an elite performer ranked Diamond with a 95% accuracy rate across 250+ problems. Exceptional technical depth paired with strong community leadership makes them a top-tier hire."},"strengths":["Consistency: 30/30 active days with a 30-day current streak (longest: 60 days)","Badges: Earned 3 badges including 3 high-tier achievements","Test Performance: Averaging 99% across 2 tests with strong recency trend"],"improve":["Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.","Increase hard problem attempts — currently only 50 hard problems solved. Target 20% more this month."],"next_badge_suggestion":"Gold Streak Master — maintain a 30-day streak to unlock","raw_data":{"problems_solved":250,"accuracy_rate":95,"active_days":30,"current_streak":30,"badges_count":3,"improvement_rate":30}},{"student_id":"fallback-2","name":"Olivia Patel","avatar":"OP","gradient":"linear-gradient(135deg,#f43f5e,#e11d48)","composite_score":743,"rank_tier":"Platinum","rank_emoji":"🥇","score_breakdown":{"problem_solving":162,"test_performance":242,"consistency":167,"badges":80,"community":64,"improvement":28},"leaderboard_position_estimate":"Top 20%","company_recommendation":{"score":72,"recruiter_pitch":"Olivia demonstrates strong technical skills with consistent growth trajectory. 20-day active streak shows dedication. A reliable candidate ready for challenging roles."},"strengths":["Test Performance: Averaging 97% across 2 tests with strong recency trend","Consistency: 29/30 active days with a 20-day current streak (longest: 50 days)","Badges: Earned 2 badges including 2 high-tier achievements"],"improve":["Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.","Increase hard problem attempts — currently only 45 hard problems solved. Target 20% more this month."],"next_badge_suggestion":"Silver Problem Solver — reach 200 problems solved to unlock","raw_data":{"problems_solved":230,"accuracy_rate":94,"active_days":29,"current_streak":20,"badges_count":2,"improvement_rate":28}},{"student_id":"fallback-3","name":"Alex Mercer","avatar":"AM","gradient":"linear-gradient(135deg,#00d4aa,#00b894)","composite_score":695,"rank_tier":"Platinum","rank_emoji":"🥇","score_breakdown":{"problem_solving":145,"test_performance":242,"consistency":150,"badges":80,"community":53,"improvement":25},"leaderboard_position_estimate":"Top 30%","company_recommendation":{"score":66,"recruiter_pitch":"Alex demonstrates strong technical skills with consistent growth trajectory. 15-day active streak shows dedication. A reliable candidate ready for challenging roles."},"strengths":["Test Performance: Averaging 97% across 2 tests with strong recency trend","Badges: Earned 2 badges including 2 high-tier achievements","Consistency: 28/30 active days with a 15-day current streak (longest: 45 days)"],"improve":["Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.","Increase hard problem attempts — currently only 40 hard problems solved. Target 20% more this month."],"next_badge_suggestion":"Silver Streak Builder — maintain a 14-day streak to unlock","raw_data":{"problems_solved":210,"accuracy_rate":92,"active_days":28,"current_streak":15,"badges_count":2,"improvement_rate":25}},{"student_id":"fallback-4","name":"Jessica Wong","avatar":"JW","gradient":"linear-gradient(135deg,#10b981,#059669)","composite_score":593,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":128,"test_performance":226,"consistency":128,"badges":45,"community":44,"improvement":22},"leaderboard_position_estimate":"Top 40%","company_recommendation":{"score":58,"recruiter_pitch":"Jessica is a growing talent with solid fundamentals and a 22% improvement rate. Shows promising potential with room for rapid advancement in the right environment."},"strengths":["Test Performance: Averaging 90% across 2 tests with strong recency trend","Consistency: 26/30 active days with a 12-day current streak (longest: 35 days)","Badges: Earned 2 badges including 1 high-tier achievements"],"improve":["Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.","Increase hard problem attempts — currently only 35 hard problems solved. Target 20% more this month."],"next_badge_suggestion":"Bronze Explorer — complete 5 more courses to unlock","raw_data":{"problems_solved":195,"accuracy_rate":89,"active_days":26,"current_streak":12,"badges_count":2,"improvement_rate":22}},{"student_id":"fallback-5","name":"Sarah Chen","avatar":"SC","gradient":"linear-gradient(135deg,#7c3aed,#6d28d9)","composite_score":549,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":114,"test_performance":220,"consistency":114,"badges":45,"community":38,"improvement":18},"leaderboard_position_estimate":"Top 50%","company_recommendation":{"score":52,"recruiter_pitch":"Sarah is a growing talent with solid fundamentals and a 18% improvement rate. Shows promising potential with room for rapid advancement in the right environment."},"strengths":["Test Performance: Averaging 88% across 2 tests with strong recency trend","Consistency: 24/30 active days with a 10-day current streak (longest: 30 days)","Badges: Earned 2 badges including 1 high-tier achievements"],"improve":["Community engagement is low — start answering peer questions and joining discussions to build visibility.","Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth."],"next_badge_suggestion":"Bronze Explorer — complete 5 more courses to unlock","raw_data":{"problems_solved":180,"accuracy_rate":88,"active_days":24,"current_streak":10,"badges_count":2,"improvement_rate":18}},{"student_id":"fallback-6","name":"Sophia Lee","avatar":"SL","gradient":"linear-gradient(135deg,#14b8a6,#0d9488)","composite_score":518,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":105,"test_performance":218,"consistency":107,"badges":35,"community":33,"improvement":20},"leaderboard_position_estimate":"Top 60%","company_recommendation":{"score":50,"recruiter_pitch":"Sophia is a growing talent with solid fundamentals and a 20% improvement rate. Shows promising potential with room for rapid advancement in the right environment."},"strengths":["Test Performance: Averaging 87% across 2 tests with strong recency trend","Consistency: 23/30 active days with a 9-day current streak (longest: 28 days)","Improvement: 20% improvement rate over the last 30 days"],"improve":["Only 2 badges earned — complete more skill challenges to unlock achievement badges.","Community engagement is low — start answering peer questions and joining discussions to build visibility."],"next_badge_suggestion":"Silver Streak Builder — maintain a 14-day streak to unlock","raw_data":{"problems_solved":175,"accuracy_rate":87,"active_days":23,"current_streak":9,"badges_count":2,"improvement_rate":20}},{"student_id":"fallback-7","name":"Ryan Johnson","avatar":"RJ","gradient":"linear-gradient(135deg,#8b5cf6,#7c3aed)","composite_score":483,"rank_tier":"Gold","rank_emoji":"🥈","score_breakdown":{"problem_solving":91,"test_performance":214,"consistency":100,"badges":30,"community":29,"improvement":19},"leaderboard_position_estimate":"Top 70%","company_recommendation":{"score":47,"recruiter_pitch":"Ryan is a growing talent with solid fundamentals and a 19% improvement rate. Shows promising potential with room for rapid advancement in the right environment."},"strengths":["Test Performance: Averaging 85% across 2 tests with strong recency trend","Consistency: 22/30 active days with a 8-day current streak (longest: 25 days)","Improvement: 19% improvement rate over the last 30 days"],"improve":["Only 2 badges earned — complete more skill challenges to unlock achievement badges.","Community engagement is low — start answering peer questions and joining discussions to build visibility."],"next_badge_suggestion":"Bronze Explorer — complete 5 more courses to unlock","raw_data":{"problems_solved":160,"accuracy_rate":85,"active_days":22,"current_streak":8,"badges_count":2,"improvement_rate":19}},{"student_id":"fallback-8","name":"David Kim","avatar":"DK","gradient":"linear-gradient(135deg,#3b82f6,#2563eb)","composite_score":421,"rank_tier":"Silver","rank_emoji":"🥉","score_breakdown":{"problem_solving":84,"test_performance":198,"consistency":83,"badges":20,"community":24,"improvement":12},"leaderboard_position_estimate":"Top 80%","company_recommendation":{"score":40,"recruiter_pitch":"David is a growing talent with solid fundamentals and a 12% improvement rate. Shows promising potential with room for rapid advancement in the right environment."},"strengths":["Test Performance: Averaging 79% across 2 tests with strong recency trend","Consistency: 20/30 active days with a 5-day current streak (longest: 20 days)","Problem Solving: Solved 150 problems with 82% accuracy, including 20 hard problems"],"improve":["Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.","Only 2 badges earned — complete more skill challenges to unlock achievement badges."],"next_badge_suggestion":"Silver Streak Builder — maintain a 14-day streak to unlock","raw_data":{"problems_solved":150,"accuracy_rate":82,"active_days":20,"current_streak":5,"badges_count":2,"improvement_rate":12}},{"student_id":"fallback-9","name":"Daniel Smith","avatar":"DS","gradient":"linear-gradient(135deg,#6366f1,#4f46e5)","composite_score":406,"rank_tier":"Silver","rank_emoji":"🥉","score_breakdown":{"problem_solving":72,"test_performance":206,"consistency":80,"badges":15,"community":18,"improvement":15},"leaderboard_position_estimate":"Top 90%","company_recommendation":{"score":39,"recruiter_pitch":"Daniel is an early-stage learner actively building foundations. Recent 15% improvement signals strong motivation. Consider for internship or junior development programs."},"strengths":["Test Performance: Averaging 82% across 2 tests with strong recency trend","Consistency: 18/30 active days with a 7-day current streak (longest: 18 days)","Improvement: 15% improvement rate over the last 30 days"],"improve":["Community engagement is low — start answering peer questions and joining discussions to build visibility.","Only 1 badges earned — complete more skill challenges to unlock achievement badges."],"next_badge_suggestion":"Silver Streak Builder — maintain a 14-day streak to unlock","raw_data":{"problems_solved":140,"accuracy_rate":80,"active_days":18,"current_streak":7,"badges_count":1,"improvement_rate":15}},{"student_id":"fallback-10","name":"Michael Torres","avatar":"MT","gradient":"linear-gradient(135deg,#f59e0b,#d97706)","composite_score":323,"rank_tier":"Silver","rank_emoji":"🥉","score_breakdown":{"problem_solving":59,"test_performance":183,"consistency":58,"badges":5,"community":10,"improvement":8},"leaderboard_position_estimate":"Top 100%","company_recommendation":{"score":30,"recruiter_pitch":"Michael is an early-stage learner actively building foundations. Recent 8% improvement signals strong motivation. Consider for internship or junior development programs."},"strengths":["Test Performance: Averaging 73% across 2 tests with strong recency trend","Consistency: 15/30 active days with a 3-day current streak (longest: 12 days)","Problem Solving: Solved 120 problems with 78% accuracy, including 10 hard problems"],"improve":["Community engagement is low — start answering peer questions and joining discussions to build visibility.","Only 1 badges earned — complete more skill challenges to unlock achievement badges."],"next_badge_suggestion":"Bronze Explorer — complete 5 more courses to unlock","raw_data":{"problems_solved":120,"accuracy_rate":78,"active_days":15,"current_streak":3,"badges_count":1,"improvement_rate":8}}];
      allStudents = fallbackData;
      render(allStudents);
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