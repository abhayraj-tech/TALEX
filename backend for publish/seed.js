/**
 * TALEX Database Seed Script
 * Run: node backend/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Course   = require('./models/Course');
const Badge    = require('./models/Badge');
const Job      = require('./models/Job');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/talex';

const badges = [
    { name: 'Python Fundamentals', icon: '🐍', description: 'Mastery of Python basics', tier: 'Bronze',   requirements: 'Complete Python 101 course', category: 'Programming', holders: 1240 },
    { name: 'React Developer',     icon: '⚛️',  description: 'Build modern React apps',  tier: 'Silver',   requirements: 'Complete React Mastery course', category: 'Frontend', holders: 890 },
    { name: 'Data Science Pro',    icon: '📊',  description: 'Advanced data analysis',   tier: 'Gold',     requirements: 'Complete 3 data science courses', category: 'Data', holders: 430 },
    { name: 'UI/UX Designer',      icon: '🎨',  description: 'Professional design skills', tier: 'Silver', requirements: 'Complete Design Fundamentals', category: 'Design', holders: 670 },
    { name: 'AI Engineer',         icon: '🤖',  description: 'Machine learning mastery', tier: 'Platinum', requirements: 'Complete AI & ML Bootcamp', category: 'AI', holders: 210 },
    { name: 'Leadership Pro',      icon: '💼',  description: 'Team leadership skills',   tier: 'Gold',     requirements: 'Complete Leadership course + peer review', category: 'Soft Skills', holders: 380 },
    { name: 'Node.js Backend',     icon: '🟢',  description: 'Server-side JavaScript',   tier: 'Silver',   requirements: 'Complete Node.js course', category: 'Backend', holders: 760 },
    { name: 'AWS Cloud',           icon: '☁️',  description: 'Cloud infrastructure',     tier: 'Gold',     requirements: 'Complete AWS Fundamentals', category: 'Cloud', holders: 320 }
];

const courses = [
    { title: 'Python 101',           description: 'Learn Python from scratch',          category: 'Programming', difficulty: 'beginner',     creditCost: 0,   instructor: 'Dr. Sarah Chen',   rating: 4.8, enrolled: 12400, isFree: true  },
    { title: 'React Mastery',        description: 'Build modern React applications',    category: 'Frontend',    difficulty: 'intermediate', creditCost: 50,  instructor: 'Alex Rivera',      rating: 4.9, enrolled: 8900,  isFree: false },
    { title: 'Data Science Bootcamp',description: 'From data to insights',              category: 'Data',        difficulty: 'intermediate', creditCost: 80,  instructor: 'Prof. James Liu',  rating: 4.7, enrolled: 6200,  isFree: false },
    { title: 'UI/UX Design Fundamentals', description: 'Design beautiful interfaces',  category: 'Design',      difficulty: 'beginner',     creditCost: 30,  instructor: 'Maya Patel',       rating: 4.6, enrolled: 9100,  isFree: false },
    { title: 'AI & ML Bootcamp',     description: 'Machine learning from zero to hero', category: 'AI',         difficulty: 'advanced',     creditCost: 120, instructor: 'Dr. Amir Hassan',  rating: 4.9, enrolled: 4300,  isFree: false },
    { title: 'Node.js Backend Dev',  description: 'Build scalable APIs with Node.js',  category: 'Backend',     difficulty: 'intermediate', creditCost: 60,  instructor: 'Carlos Mendez',    rating: 4.7, enrolled: 7600,  isFree: false },
    { title: 'Leadership & Management', description: 'Lead teams effectively',          category: 'Soft Skills', difficulty: 'beginner',     creditCost: 40,  instructor: 'Dr. Lisa Thompson',rating: 4.5, enrolled: 5800,  isFree: false },
    { title: 'AWS Cloud Fundamentals', description: 'Master cloud infrastructure',     category: 'Cloud',       difficulty: 'intermediate', creditCost: 90,  instructor: 'Tom Bradley',      rating: 4.8, enrolled: 3200,  isFree: false }
];

const jobs = [
    { title: 'Junior Python Developer', company: 'TechCorp',    description: 'Build backend services', requiredBadges: ['Python Fundamentals'], requiredSkills: ['Python', 'REST APIs'], salary: '$60k-$80k',  location: 'Remote',       type: 'full-time' },
    { title: 'React Frontend Engineer', company: 'StartupXYZ',  description: 'Build React applications', requiredBadges: ['React Developer'],    requiredSkills: ['React', 'TypeScript'], salary: '$80k-$110k', location: 'New York, NY', type: 'full-time' },
    { title: 'Data Analyst',            company: 'DataInsights', description: 'Analyze business data',   requiredBadges: ['Data Science Pro'],   requiredSkills: ['Python', 'SQL'],       salary: '$70k-$95k',  location: 'Remote',       type: 'full-time' },
    { title: 'UI/UX Designer',          company: 'DesignStudio', description: 'Design user experiences', requiredBadges: ['UI/UX Designer'],     requiredSkills: ['Figma', 'Prototyping'],salary: '$65k-$90k',  location: 'San Francisco',type: 'full-time' },
    { title: 'ML Engineer',             company: 'AI Labs',      description: 'Build ML pipelines',      requiredBadges: ['AI Engineer'],        requiredSkills: ['Python', 'TensorFlow'],salary: '$120k-$160k',location: 'Remote',       type: 'full-time' }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            Badge.deleteMany({}),
            Course.deleteMany({}),
            Job.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        // Insert badges first
        const createdBadges = await Badge.insertMany(badges);
        console.log(`✅ Seeded ${createdBadges.length} badges`);

        // Map badge names to IDs for courses
        const badgeMap = {};
        createdBadges.forEach(b => { badgeMap[b.name] = b._id; });

        const coursesWithBadges = courses.map((c, i) => ({
            ...c,
            badge: createdBadges[i]?._id
        }));

        await Course.insertMany(coursesWithBadges);
        console.log(`✅ Seeded ${courses.length} courses`);

        await Job.insertMany(jobs);
        console.log(`✅ Seeded ${jobs.length} jobs`);

        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
}

seed();
