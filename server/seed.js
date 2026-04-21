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

console.log('\n🎉 Database seeded successfully!');
console.log('   Run "npm start" to launch the server.\n');
