/**
 * TALEX Database Seeder
 * Populates the JSON database with initial TALEX data.
 * Run: npm run seed
 */
require('dotenv').config();
const { getCollection } = require('./config/db');

console.log('🌱 Seeding TALEX database...\n');

// ===== CLEAR EXISTING DATA =====
const instructors = getCollection('instructors');
const courses = getCollection('courses');
const testimonials = getCollection('testimonials');
const studentPerformance = getCollection('student_performance');
instructors.clear();
courses.clear();
testimonials.clear();
studentPerformance.clear();

// ===== SEED INSTRUCTORS =====
const instructorData = [
  { name: 'Sarah Chen', bio: 'Lead UI/UX Designer with 10+ years at top tech companies. Passionate about creating human-centered digital experiences.', role: 'UI/UX Design Lead', avatar: 'SC', gradient: 'linear-gradient(135deg,#00d4aa,#00b894)' },
  { name: 'James Rivera', bio: 'Data scientist and AI researcher specializing in machine learning and predictive analytics.', role: 'Data Science Expert', avatar: 'JR', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  { name: 'Maya Patel', bio: 'Award-winning digital artist whose work has been featured in galleries worldwide.', role: 'Digital Artist', avatar: 'MP', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  { name: 'Alex Thompson', bio: 'Marketing strategist who has helped 50+ startups scale their digital presence.', role: 'Marketing Strategist', avatar: 'AT', gradient: 'linear-gradient(135deg,#ec4899,#db2777)' }
];

const savedInstructors = instructorData.map(i => instructors.create(i));
console.log(`✅ Seeded ${savedInstructors.length} instructors`);

// ===== SEED COURSES =====
const courseData = [
  { 
    title: 'Modern UI/UX Design Masterclass', 
    description: 'Learn to create stunning user interfaces and seamless user experiences using Figma, Adobe XD, and design thinking principles. This course will take you from a complete beginner to a confident designer capable of building wireframes, interactive prototypes, and high-fidelity mockups.<br><br><strong>🚀 Future Outcome:</strong> Build a standout portfolio and land a role as a Junior UI/UX Designer or Product Designer.<br><strong>🏢 Top Hiring Companies:</strong> Apple, Google, Airbnb, and leading creative agencies.<br><strong>⏱️ Time Period:</strong> 6 weeks (part-time)', 
    category: 'design', 
    instructorId: savedInstructors[0]._id, 
    thumbnail: 'img/course_uiux.png', 
    tags: ['trending', 'badge'], 
    credits: 50, rating: 4.8, duration: '6 hours', 
    skills: ['Figma', 'Prototyping', 'User Research'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Data Science with Python', 
    description: 'Master data analysis, visualization, and machine learning with Python, Pandas, and Scikit-learn. You will analyze real-world datasets, build predictive models, and learn how to extract actionable business insights from raw data.<br><br><strong>🚀 Future Outcome:</strong> Transition into a Data Analyst or Junior Data Scientist role.<br><strong>🏢 Top Hiring Companies:</strong> Amazon, Meta, Netflix, and top-tier financial institutions.<br><strong>⏱️ Time Period:</strong> 8 weeks (part-time)', 
    category: 'data', 
    instructorId: savedInstructors[1]._id, 
    thumbnail: 'img/course_photography.png', 
    tags: ['new'], 
    credits: 75, rating: 4.7, duration: '12 hours', 
    skills: ['Python', 'Pandas', 'Machine Learning'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Digital Art & Illustration Fundamentals', 
    description: 'Explore digital painting techniques, color theory, and illustration workflows using Procreate and Photoshop. Discover how to find your unique art style, create engaging character designs, and build cohesive digital environments.<br><br><strong>🚀 Future Outcome:</strong> Work as a Freelance Illustrator, Concept Artist, or 2D Game Asset Creator.<br><strong>🏢 Top Hiring Companies:</strong> Riot Games, Disney, freelance marketplaces, and indie game studios.<br><strong>⏱️ Time Period:</strong> 4 weeks (part-time)', 
    category: 'design', 
    instructorId: savedInstructors[2]._id, 
    thumbnail: 'img/course_fineart.png', 
    tags: ['hot', 'trending'], 
    credits: 40, rating: 4.9, duration: '4 hours', 
    skills: ['Procreate', 'Color Theory', 'Sketching'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Social Media Marketing Pro', 
    description: 'Build effective social media strategies, create compelling content, and measure ROI across all major platforms. Learn advanced ad targeting, influencer partnerships, and viral loop mechanics to skyrocket brand growth.<br><br><strong>🚀 Future Outcome:</strong> Become a Social Media Manager, Growth Hacker, or Digital Marketing Strategist.<br><strong>🏢 Top Hiring Companies:</strong> VaynerMedia, HubSpot, Shopify, and e-commerce brands.<br><strong>⏱️ Time Period:</strong> 5 weeks (part-time)', 
    category: 'marketing', 
    instructorId: savedInstructors[3]._id, 
    thumbnail: 'img/course_marketing.png', 
    tags: ['badge', 'trending'], 
    credits: 60, rating: 4.6, duration: '8 hours', 
    skills: ['Strategy', 'Content Creation', 'Analytics'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Full-Stack Web Development', 
    description: 'Master the complete web development flow. Build modern, responsive, and secure web applications from scratch using HTML, CSS, JavaScript, React, Node.js, and MongoDB. You will build and deploy 3 production-ready web apps.<br><br><strong>🚀 Future Outcome:</strong> Launch a career as a Full-Stack Software Engineer or Frontend Developer.<br><strong>🏢 Top Hiring Companies:</strong> Microsoft, Stripe, Vercel, and thousands of tech startups globally.<br><strong>⏱️ Time Period:</strong> 12 weeks (intensive)', 
    category: 'web-development', 
    instructorId: savedInstructors[0]._id, 
    thumbnail: 'img/course_writing.png', 
    tags: ['new', 'trending', 'badge'], 
    credits: 80, rating: 4.9, duration: '15 hours', 
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Brand Identity Design from Scratch', 
    description: 'Create compelling brand identities including logos, typography systems, color palettes, and brand guidelines. Understand the psychology of branding and how to pitch visual identities to high-paying clients.<br><br><strong>🚀 Future Outcome:</strong> Become a Brand Designer, Art Director, or start your own design agency.<br><strong>🏢 Top Hiring Companies:</strong> Pentagram, Ogilvy, Nike, and global creative studios.<br><strong>⏱️ Time Period:</strong> 4 weeks (part-time)', 
    category: 'design', 
    instructorId: savedInstructors[1]._id, 
    thumbnail: 'img/course_uiux.png', 
    tags: ['hot'], 
    credits: 55, rating: 4.8, duration: '5 hours', 
    skills: ['Logo Design', 'Typography', 'Branding'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'AI & Machine Learning Bootcamp', 
    description: 'Deep dive into neural networks, NLP, computer vision, and deploy ML models to production using PyTorch and TensorFlow. Learn how to train Large Language Models and build your own generative AI applications.<br><br><strong>🚀 Future Outcome:</strong> Secure a role as a Machine Learning Engineer or AI Researcher.<br><strong>🏢 Top Hiring Companies:</strong> OpenAI, Anthropic, Google DeepMind, and Tesla.<br><strong>⏱️ Time Period:</strong> 10 weeks (intensive)', 
    category: 'data', 
    instructorId: savedInstructors[2]._id, 
    thumbnail: 'img/course_marketing.png', 
    tags: ['trending', 'badge'], 
    credits: 90, rating: 4.9, duration: '20 hours', 
    skills: ['PyTorch', 'TensorFlow', 'NLP'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    title: 'Cloud Architecture Fundamentals', 
    description: 'Design scalable cloud solutions using AWS, containerization with Docker, and CI/CD pipelines. Learn to build serverless architectures, manage database clusters, and ensure high availability for enterprise apps.<br><br><strong>🚀 Future Outcome:</strong> Get hired as a Cloud Architect, DevOps Engineer, or Site Reliability Engineer (SRE).<br><strong>🏢 Top Hiring Companies:</strong> Amazon Web Services (AWS), Datadog, Cloudflare, and Spotify.<br><strong>⏱️ Time Period:</strong> 6 weeks (part-time)', 
    category: 'web-development', 
    instructorId: savedInstructors[3]._id, 
    thumbnail: 'img/course_fineart.png', 
    tags: ['new'], 
    credits: 70, rating: 4.7, duration: '10 hours', 
    skills: ['AWS', 'Docker', 'CI/CD'], 
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  }
];

const savedCourses = courseData.map(c => courses.create(c));
console.log(`✅ Seeded ${savedCourses.length} courses`);

// ===== SEED TESTIMONIALS =====
const testimonialData = [
  { name: 'Emma Johnson', role: 'Hired as UX Designer', review: 'TALEX changed the game for me. I earned badges, built a real portfolio, and got hired within 3 months — no traditional resume needed.', avatar: 'EJ', gradient: 'linear-gradient(135deg,#00d4aa,#00b894)', rating: 5 },
  { name: 'Marcus Cole', role: 'Data Analyst at TechCorp', review: 'The credit system is genius — I earned while learning and used credits to unlock advanced courses. Then the AI matched me with my dream company.', avatar: 'MC', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', rating: 5 },
  { name: 'Aisha Patel', role: 'TALEX Creator · 12 Courses', review: 'As a creator on TALEX, I teach what I know and earn credits doing it. The verified badge system ensures only quality content thrives. Love this platform!', avatar: 'AP', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', rating: 5 }
];

const savedTestimonials = testimonialData.map(t => testimonials.create(t));
console.log(`✅ Seeded ${savedTestimonials.length} testimonials`);

// ===== SEED STUDENT PERFORMANCE =====
const studentData = [
  {
    name: 'Alex Mercer', avatar: 'AM', gradient: 'linear-gradient(135deg,#00d4aa,#00b894)',
    problem_solving: { problems_solved: 210, accuracy_rate: 92, difficulty_breakdown: { easy: 80, medium: 90, hard: 40 } },
    test_scores: [{ date: '2026-03-10', score: 95, max_score: 100 }, { date: '2026-04-10', score: 98, max_score: 100 }],
    consistency: { active_days_last_30: 28, current_streak_days: 15, longest_streak_days: 45 },
    badges: ['Platinum Solver', 'Gold Streak Master'],
    peer_interactions: { solutions_upvoted: 250, discussions_started: 15, help_given_count: 50 },
    improvement_rate: 25
  },
  {
    name: 'Sarah Chen', avatar: 'SC', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
    problem_solving: { problems_solved: 180, accuracy_rate: 88, difficulty_breakdown: { easy: 70, medium: 80, hard: 30 } },
    test_scores: [{ date: '2026-03-12', score: 85, max_score: 100 }, { date: '2026-04-15', score: 90, max_score: 100 }],
    consistency: { active_days_last_30: 24, current_streak_days: 10, longest_streak_days: 30 },
    badges: ['Gold Solver', 'Silver Streak Builder'],
    peer_interactions: { solutions_upvoted: 180, discussions_started: 10, help_given_count: 35 },
    improvement_rate: 18
  },
  {
    name: 'David Kim', avatar: 'DK', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    problem_solving: { problems_solved: 150, accuracy_rate: 82, difficulty_breakdown: { easy: 60, medium: 70, hard: 20 } },
    test_scores: [{ date: '2026-03-05', score: 75, max_score: 100 }, { date: '2026-04-05', score: 82, max_score: 100 }],
    consistency: { active_days_last_30: 20, current_streak_days: 5, longest_streak_days: 20 },
    badges: ['Silver Solver', 'Bronze Explorer'],
    peer_interactions: { solutions_upvoted: 120, discussions_started: 5, help_given_count: 20 },
    improvement_rate: 12
  },
  {
    name: 'Emily Davis', avatar: 'ED', gradient: 'linear-gradient(135deg,#ec4899,#db2777)',
    problem_solving: { problems_solved: 250, accuracy_rate: 95, difficulty_breakdown: { easy: 100, medium: 100, hard: 50 } },
    test_scores: [{ date: '2026-03-20', score: 98, max_score: 100 }, { date: '2026-04-18', score: 100, max_score: 100 }],
    consistency: { active_days_last_30: 30, current_streak_days: 30, longest_streak_days: 60 },
    badges: ['Platinum Solver', 'Platinum Streak Legend', 'Gold Mentor'],
    peer_interactions: { solutions_upvoted: 400, discussions_started: 25, help_given_count: 80 },
    improvement_rate: 30
  },
  {
    name: 'Michael Torres', avatar: 'MT', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    problem_solving: { problems_solved: 120, accuracy_rate: 78, difficulty_breakdown: { easy: 50, medium: 60, hard: 10 } },
    test_scores: [{ date: '2026-03-15', score: 70, max_score: 100 }, { date: '2026-04-20', score: 75, max_score: 100 }],
    consistency: { active_days_last_30: 15, current_streak_days: 3, longest_streak_days: 12 },
    badges: ['Bronze Explorer'],
    peer_interactions: { solutions_upvoted: 50, discussions_started: 2, help_given_count: 10 },
    improvement_rate: 8
  },
  {
    name: 'Jessica Wong', avatar: 'JW', gradient: 'linear-gradient(135deg,#10b981,#059669)',
    problem_solving: { problems_solved: 195, accuracy_rate: 89, difficulty_breakdown: { easy: 75, medium: 85, hard: 35 } },
    test_scores: [{ date: '2026-03-25', score: 88, max_score: 100 }, { date: '2026-04-22', score: 92, max_score: 100 }],
    consistency: { active_days_last_30: 26, current_streak_days: 12, longest_streak_days: 35 },
    badges: ['Gold Solver', 'Silver Streak Builder'],
    peer_interactions: { solutions_upvoted: 210, discussions_started: 12, help_given_count: 40 },
    improvement_rate: 22
  },
  {
    name: 'Daniel Smith', avatar: 'DS', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    problem_solving: { problems_solved: 140, accuracy_rate: 80, difficulty_breakdown: { easy: 60, medium: 65, hard: 15 } },
    test_scores: [{ date: '2026-03-08', score: 78, max_score: 100 }, { date: '2026-04-12', score: 85, max_score: 100 }],
    consistency: { active_days_last_30: 18, current_streak_days: 7, longest_streak_days: 18 },
    badges: ['Silver Solver'],
    peer_interactions: { solutions_upvoted: 90, discussions_started: 4, help_given_count: 15 },
    improvement_rate: 15
  },
  {
    name: 'Olivia Patel', avatar: 'OP', gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)',
    problem_solving: { problems_solved: 230, accuracy_rate: 94, difficulty_breakdown: { easy: 90, medium: 95, hard: 45 } },
    test_scores: [{ date: '2026-03-01', score: 96, max_score: 100 }, { date: '2026-04-02', score: 97, max_score: 100 }],
    consistency: { active_days_last_30: 29, current_streak_days: 20, longest_streak_days: 50 },
    badges: ['Platinum Solver', 'Gold Streak Master'],
    peer_interactions: { solutions_upvoted: 300, discussions_started: 20, help_given_count: 60 },
    improvement_rate: 28
  },
  {
    name: 'Ryan Johnson', avatar: 'RJ', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    problem_solving: { problems_solved: 160, accuracy_rate: 85, difficulty_breakdown: { easy: 65, medium: 75, hard: 20 } },
    test_scores: [{ date: '2026-03-18', score: 82, max_score: 100 }, { date: '2026-04-16', score: 88, max_score: 100 }],
    consistency: { active_days_last_30: 22, current_streak_days: 8, longest_streak_days: 25 },
    badges: ['Silver Solver', 'Silver Streak Builder'],
    peer_interactions: { solutions_upvoted: 140, discussions_started: 8, help_given_count: 25 },
    improvement_rate: 19
  },
  {
    name: 'Sophia Lee', avatar: 'SL', gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)',
    problem_solving: { problems_solved: 175, accuracy_rate: 87, difficulty_breakdown: { easy: 70, medium: 80, hard: 25 } },
    test_scores: [{ date: '2026-03-22', score: 84, max_score: 100 }, { date: '2026-04-25', score: 89, max_score: 100 }],
    consistency: { active_days_last_30: 23, current_streak_days: 9, longest_streak_days: 28 },
    badges: ['Gold Solver', 'Bronze Explorer'],
    peer_interactions: { solutions_upvoted: 160, discussions_started: 9, help_given_count: 30 },
    improvement_rate: 20
  }
];

const savedStudents = studentData.map(s => studentPerformance.create(s));
console.log(`✅ Seeded ${savedStudents.length} student performance records`);

console.log('\n🎉 Database seeded successfully!');
console.log('   Run "npm start" to launch the server.\n');
