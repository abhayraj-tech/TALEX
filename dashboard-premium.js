// ═══════════════════════════════════════════
// TALEX Premium Dashboard — Animations & Effects
// ═══════════════════════════════════════════

(function() {
  'use strict';

  // ── 1. Hero Welcome Greeting ──
  const greetEl = document.getElementById('welcomeGreeting');
  const dateEl = document.getElementById('welcomeDate');
  if (greetEl) {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    
    const user = JSON.parse(localStorage.getItem('talex_user') || 'null');
    const name = user?.name?.split(' ')[0] || 'Abhay';
    greetEl.textContent = `${greeting}, ${name} 👋`;
  }
  if (dateEl) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', opts);
  }

  // ── 2. Counter Animation (Stats) ──
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.getAttribute('data-count'));
      const duration = 1500;
      const start = performance.now();
      const isInt = Number.isInteger(target);

      function update(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;
        el.textContent = isInt ? Math.round(current) : current.toFixed(1);
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // Trigger counters after a short delay
  setTimeout(animateCounters, 600);

  // ── 3. Cursor Glow Effect ──
  const glow = document.getElementById('cursor-glow');
  if (glow) {
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // ── 4. Publish Button Ripple Effect ──
  const publishBtn = document.querySelector('.publish-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // ── 5. Scroll Reveal for Lower Sections ──
  function initScrollReveal() {
    const bentoGrid = document.querySelector('.bento-grid');
    const anonWidget = document.querySelector('.anon-widget');
    const publishedSection = document.querySelector('.published-grid');
    
    [bentoGrid, anonWidget, publishedSection].forEach(el => {
      if (el) el.classList.add('scroll-reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
  }
  
  // Small delay to let DOM settle
  setTimeout(initScrollReveal, 100);

  // ── 6. Avatar Stack Tooltips ──
  document.querySelectorAll('.mini-avatar').forEach(avatar => {
    if (avatar.classList.contains('more')) return;
    const name = avatar.textContent.trim();
    avatar.setAttribute('title', name);
    avatar.style.cursor = 'pointer';
  });

  // ── 7. Update credits from user data ──
  const user = JSON.parse(localStorage.getItem('talex_user') || 'null');
  if (user && user.credits) {
    const creditsEl = document.getElementById('statCredits');
    if (creditsEl) creditsEl.setAttribute('data-count', user.credits);
  }

})();
