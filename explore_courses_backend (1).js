/**
 * ============================================================
 *  TALEX — explore_courses_backend.js
 *  Simulated backend: course data, enrollment, credits, API
 * ============================================================
 */

"use strict";

/* ---- COURSE DATABASE ---- */
const DB = {
  courses: [
    {
      id: 1, title: "AI & ML Fundamentals 2026",
      category: "AI & ML", instructor: "Dr. Priya Sharma",
      description: "Master core AI and ML concepts — supervised learning, neural networks, and real-world projects using Python and TensorFlow.",
      duration: "8 hrs", lessons: 24, rating: 4.9, students: 3240, price: 120,
      tags: ["Python", "TensorFlow", "Neural Nets", "Data Science"],
      gradient: "linear-gradient(135deg,#0f2c5c,#0a3d62,#00D4C8 150%)",
      enrolled: false
    },
    {
      id: 2, title: "Startup Pitch Masterclass",
      category: "Startup", instructor: "Rahul Kapoor",
      description: "Learn the art of pitching to investors. Covers storytelling, deck design, handling tough Q&A, and your elevator pitch.",
      duration: "5 hrs", lessons: 15, rating: 4.7, students: 1890, price: 80,
      tags: ["Pitching", "Fundraising", "Storytelling", "VC"],
      gradient: "linear-gradient(135deg,#2d1b69,#4a2080,#7B61FF 150%)",
      enrolled: false
    },
    {
      id: 3, title: "Creative Design Sprint",
      category: "Design", instructor: "Meera Iyer",
      description: "Ideate, prototype and test solutions in days using design thinking, Figma and rapid iteration techniques.",
      duration: "6 hrs", lessons: 18, rating: 4.8, students: 2105, price: 100,
      tags: ["Figma", "Design Thinking", "Prototyping", "UX"],
      gradient: "linear-gradient(135deg,#5c1a1a,#7a2e2e,#FF6B6B 150%)",
      enrolled: false
    },
    {
      id: 4, title: "Data Visualization with Python",
      category: "Data", instructor: "Ankita Roy",
      description: "Turn raw numbers into compelling stories with Matplotlib, Seaborn, and Plotly. Build dashboards that speak for themselves.",
      duration: "7 hrs", lessons: 21, rating: 4.6, students: 1560, price: 90,
      tags: ["Python", "Matplotlib", "Plotly", "Pandas"],
      gradient: "linear-gradient(135deg,#0a3d2e,#0d5c42,#00D4C8 150%)",
      enrolled: false
    },
    {
      id: 5, title: "Full-Stack Web Bootcamp",
      category: "Web Dev", instructor: "Siddharth Menon",
      description: "From zero to job-ready: HTML, CSS, JavaScript, React and Node.js in one comprehensive bootcamp.",
      duration: "20 hrs", lessons: 60, rating: 4.9, students: 5400, price: 200,
      tags: ["HTML", "CSS", "React", "Node.js"],
      gradient: "linear-gradient(135deg,#1a2c1a,#2a441a,#4ade80 150%)",
      enrolled: false
    },
    {
      id: 6, title: "Cultural Leadership",
      category: "Cultural", instructor: "Aisha Fernandez",
      description: "Understand cross-cultural communication, lead diverse teams, and build inclusive workplaces in the global economy.",
      duration: "4 hrs", lessons: 12, rating: 4.5, students: 980, price: 0,
      tags: ["Leadership", "Diversity", "Communication", "Teams"],
      gradient: "linear-gradient(135deg,#3d2a00,#6b4800,#FFD166 150%)",
      enrolled: false
    },
    {
      id: 7, title: "NLP & Large Language Models",
      category: "AI & ML", instructor: "Dr. Arjun Nair",
      description: "Deep dive into transformers, fine-tuning LLMs, prompt engineering, and building AI-powered applications from scratch.",
      duration: "12 hrs", lessons: 36, rating: 4.9, students: 4100, price: 180,
      tags: ["LLMs", "Transformers", "NLP", "Python"],
      gradient: "linear-gradient(135deg,#0f2c5c,#1a3a70,#3b82f6 150%)",
      enrolled: false
    },
    {
      id: 8, title: "UX Research Fundamentals",
      category: "Design", instructor: "Nandita Ghosh",
      description: "Learn user interviews, usability testing, journey mapping and synthesis techniques that transform products.",
      duration: "5 hrs", lessons: 16, rating: 4.7, students: 1200, price: 70,
      tags: ["UX", "Research", "Usability", "Journey Maps"],
      gradient: "linear-gradient(135deg,#4a0020,#7a0030,#f43f5e 150%)",
      enrolled: false
    }
  ],

  user: {
    id: "user_abhay_001",
    name: "Abhay",
    credits: 500,
    enrolledIds: []
  }
};

/* ---- SIMULATED API ---- */
const API = {
  _delay: (ms = 400) => new Promise(r => setTimeout(r, ms)),

  async getCourses() {
    await this._delay(600);
    return { success: true, data: DB.courses, total: DB.courses.length };
  },

  async getCourse(id) {
    await this._delay(200);
    const course = DB.courses.find(c => c.id === id);
    if (!course) return { success: false, error: "Course not found" };
    return { success: true, data: course };
  },

  async enroll(courseId) {
    await this._delay(500);
    const course = DB.courses.find(c => c.id === courseId);
    if (!course) return { success: false, error: "Course not found" };

    if (course.enrolled) {
      // Unenroll
      course.enrolled = false;
      DB.user.enrolledIds = DB.user.enrolledIds.filter(id => id !== courseId);
      DB.user.credits += course.price;
      return { success: true, action: "unenrolled", credits: DB.user.credits };
    }

    if (DB.user.credits < course.price) {
      return { success: false, error: `Not enough credits. Need ${course.price}, have ${DB.user.credits}.` };
    }

    course.enrolled = true;
    course.students += 1;
    DB.user.enrolledIds.push(courseId);
    DB.user.credits -= course.price;
    return { success: true, action: "enrolled", credits: DB.user.credits };
  },

  async searchCourses(query) {
    await this._delay(200);
    const q = query.toLowerCase();
    const results = DB.courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
    return { success: true, data: results, total: results.length };
  },

  async filterCourses(category) {
    await this._delay(150);
    const results = category === "All" ? DB.courses : DB.courses.filter(c => c.category === category);
    return { success: true, data: results };
  },

  async sortCourses(courses, by) {
    const map = { rating: (a,b) => b.rating - a.rating, students: (a,b) => b.students - a.students, price: (a,b) => a.price - b.price };
    return map[by] ? [...courses].sort(map[by]) : courses;
  },

  async getUser() {
    await this._delay(100);
    return { success: true, data: DB.user };
  }
};

/* Expose globally */
window.API = API;
window.DB  = DB;
