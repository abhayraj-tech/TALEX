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
instructors.clear();
courses.clear();
testimonials.clear();

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
  { title: 'Modern UI/UX Design Masterclass', description: 'Learn to create stunning user interfaces and seamless user experiences using Figma, Adobe XD, and design thinking principles.', category: 'design', instructorId: savedInstructors[0]._id, thumbnail: 'img/course_uiux.png', tags: ['trending', 'badge'], credits: 50 },
  { title: 'Data Science with Python', description: 'Master data analysis, visualization, and machine learning with Python, Pandas, and Scikit-learn.', category: 'data', instructorId: savedInstructors[1]._id, thumbnail: 'img/course_photography.png', tags: ['new'], credits: 75 },
  { title: 'Digital Art & Illustration Fundamentals', description: 'Explore digital painting techniques, color theory, and illustration workflows using Procreate and Photoshop.', category: 'design', instructorId: savedInstructors[2]._id, thumbnail: 'img/course_fineart.png', tags: ['hot', 'trending'], credits: 40 },
  { title: 'Social Media Marketing Pro', description: 'Build effective social media strategies, create compelling content, and measure ROI across all major platforms.', category: 'marketing', instructorId: savedInstructors[3]._id, thumbnail: 'img/course_marketing.png', tags: ['badge', 'trending'], credits: 60 },
  { title: 'Full-Stack Web Development', description: 'Build modern web applications from scratch using HTML, CSS, JavaScript, React, Node.js, and databases.', category: 'development', instructorId: savedInstructors[0]._id, thumbnail: 'img/course_writing.png', tags: ['new', 'trending'], credits: 80 },
  { title: 'Brand Identity Design from Scratch', description: 'Create compelling brand identities including logos, typography systems, color palettes, and brand guidelines.', category: 'design', instructorId: savedInstructors[1]._id, thumbnail: 'img/course_uiux.png', tags: ['hot'], credits: 55 },
  { title: 'AI & Machine Learning Bootcamp', description: 'Deep dive into neural networks, NLP, computer vision, and deploy ML models to production.', category: 'data', instructorId: savedInstructors[2]._id, thumbnail: 'img/course_marketing.png', tags: ['trending', 'badge'], credits: 90 },
  { title: 'Cloud Architecture Fundamentals', description: 'Design scalable cloud solutions using AWS, containerization with Docker, and CI/CD pipelines.', category: 'development', instructorId: savedInstructors[3]._id, thumbnail: 'img/course_fineart.png', tags: ['new'], credits: 70 }
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

console.log('\n🎉 Database seeded successfully!');
console.log('   Run "npm start" to launch the server.\n');
