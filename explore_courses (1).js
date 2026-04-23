/**
 * ============================================================
 *  TALEX — explore_courses.js
 *  UI controller: renders cards, handles filters, modal, toast
 * ============================================================
 */

"use strict";

const UI = (() => {
  /* --- state --- */
  let allCourses = [];
  let activeFilter = "All";
  let activeSort   = "default";
  let searchTimer  = null;

  /* --- DOM refs --- */
  const grid        = () => document.getElementById("coursesGrid");
  const loading     = () => document.getElementById("loadingState");
  const empty       = () => document.getElementById("emptyState");
  const totalCount  = () => document.getElementById("totalCount");
  const overlay     = () => document.getElementById("modalOverlay");
  const modalBody   = () => document.getElementById("modalContent");
  const toastEl     = () => document.getElementById("toast");
  const searchInput = () => document.getElementById("searchInput");

  /* ---- INIT ---- */
  async function init() {
    const res = await API.getCourses();
    loading().style.display = "none";
    if (!res.success) { showToast("Failed to load courses", true); return; }
    allCourses = res.data;
    totalCount().textContent = allCourses.length;
    render(allCourses);

    /* Search with debounce */
    searchInput().addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        const q = searchInput().value.trim();
        if (!q) { applyFilters(); return; }
        const r = await API.searchCourses(q);
        render(r.data);
      }, 300);
    });
  }

  /* ---- FILTER ---- */
  async function setFilter(category, btn) {
    activeFilter = category;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    searchInput().value = "";
    applyFilters();
  }

  /* ---- SORT ---- */
  async function setSort(val) {
    activeSort = val;
    applyFilters();
  }

  async function applyFilters() {
    let res = await API.filterCourses(activeFilter);
    let list = res.data;
    if (activeSort !== "default") list = await API.sortCourses(list, activeSort);
    render(list);
  }

  /* ---- RENDER GRID ---- */
  function render(list) {
    empty().style.display = "none";
    if (!list.length) { grid().innerHTML = ""; empty().style.display = "flex"; return; }

    grid().innerHTML = list.map((c, i) => `
      <div class="course-card" style="animation-delay:${i * 0.05}s" onclick="UI.openModal(${c.id})">
        <div class="card-img" style="background:${c.gradient}">
          <span class="cat-badge">${c.category}</span>
          ${c.enrolled ? '<span class="enrolled-badge">Enrolled ✓</span>' : ""}
          <div class="card-img-overlay"></div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${c.title}</h3>
          <p class="card-instructor">by ${c.instructor}</p>
          <div class="card-meta">
            <span class="meta-item">⏱ ${c.duration}</span>
            <span class="meta-item">📚 ${c.lessons} lessons</span>
            <span class="meta-item">⭐ ${c.rating}</span>
          </div>
          <div class="card-footer">
            <span class="price">${c.price === 0 ? "Free" : c.price + " ⚡"}</span>
            <button class="btn-enroll ${c.enrolled ? "enrolled" : ""}"
              onclick="event.stopPropagation(); UI.enroll(${c.id}, this)">
              ${c.enrolled ? "Continue" : "Enroll"}
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  /* ---- MODAL ---- */
  async function openModal(id) {
    const res = await API.getCourse(id);
    if (!res.success) { showToast("Could not load course details", true); return; }
    const c = res.data;

    modalBody().innerHTML = `
      <div class="modal-img" style="background:${c.gradient}">
        <span class="cat-badge">${c.category}</span>
      </div>
      <div class="modal-body">
        <h2>${c.title}</h2>
        <p class="modal-instructor">by <strong>${c.instructor}</strong></p>
        <p class="modal-desc">${c.description}</p>
        <div class="modal-stats">
          <div class="mstat"><span>${c.rating}⭐</span><label>Rating</label></div>
          <div class="mstat"><span>${c.students.toLocaleString()}</span><label>Students</label></div>
          <div class="mstat"><span>${c.duration}</span><label>Duration</label></div>
          <div class="mstat"><span>${c.lessons}</span><label>Lessons</label></div>
        </div>
        <div class="modal-tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="modal-actions">
          <span class="modal-price">${c.price === 0 ? "Free" : c.price + " ⚡ Credits"}</span>
          <button class="btn-enroll large ${c.enrolled ? "enrolled" : ""}"
            id="modalEnrollBtn"
            onclick="UI.enroll(${c.id}, this)">
            ${c.enrolled ? "Continue Learning" : "Enroll Now"}
          </button>
        </div>
      </div>
    `;
    overlay().classList.add("active");
  }

  function closeModal() {
    overlay().classList.remove("active");
  }

  /* ---- ENROLL ---- */
  async function enroll(id, btn) {
    btn.disabled = true;
    btn.textContent = "…";

    const res = await API.enroll(id);

    if (!res.success) {
      showToast("❌ " + res.error, true);
      const c = DB.courses.find(x => x.id === id);
      btn.textContent = c && c.enrolled ? "Continue" : "Enroll";
      btn.disabled = false;
      return;
    }

    const c = DB.courses.find(x => x.id === id);
    const isEnrolled = c.enrolled;

    btn.textContent   = isEnrolled ? (btn.classList.contains("large") ? "Continue Learning" : "Continue") : "Enroll";
    btn.classList.toggle("enrolled", isEnrolled);
    btn.disabled = false;

    showToast(isEnrolled
      ? `✓ Enrolled in "${c.title}" — ${res.credits} ⚡ left`
      : `Unenrolled. ${res.credits} ⚡ refunded`
    );

    /* Update credits in topbar */
    const credEl = document.querySelector(".user-credits");
    if (credEl) credEl.textContent = `${res.credits} ⚡ Credits`;

    /* Refresh grid */
    applyFilters();
  }

  /* ---- TOAST ---- */
  let toastTimer = null;
  function showToast(msg, isError = false) {
    const t = toastEl();
    t.textContent = msg;
    t.style.borderColor = isError ? "rgba(255,107,107,.4)" : "rgba(0,212,200,.22)";
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  /* ---- PUBLIC API ---- */
  return { init, setFilter, setSort, openModal, closeModal, enroll };
})();

/* Boot */
document.addEventListener("DOMContentLoaded", UI.init);
