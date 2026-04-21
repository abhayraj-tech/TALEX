# 🚀 TALEX — Skill-Based Learning & Hiring Platform

TALEX is a next-generation platform that connects **learning, earning, and hiring** into one ecosystem. Students build real-world skills, earn credits, collect verified badges, and get hired based on actual performance — not traditional resumes.

![TALEX](https://img.shields.io/badge/TALEX-Skill%20Economy-00d4aa?style=for-the-badge)

## ✨ Features

- **Credit-Based System** — Earn credits through learning, engagement, and content creation
- **Verified Skill Badges** — Prove your abilities with badges backed by real performance
- **AI-Powered Hiring** — Companies find candidates based on actual skills and projects
- **Creator Ecosystem** — Students can become teachers and earn on the platform
- **Course Enrollment** — Browse, filter, and enroll in curated skill tracks

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | JSON file-based (no MongoDB needed) |
| Auth | JWT + bcrypt |
| API | RESTful architecture |

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/abhayraj-tech/TALEX.git
cd TALEX

# 2. Install dependencies
cd server
npm install

# 3. Create environment file
echo "JWT_SECRET=your_secret_key_here" > .env
echo "PORT=5000" >> .env

# 4. Seed the database
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:5000/new.html** in your browser.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account (100 free credits) |
| `/api/auth/login` | POST | Log in |
| `/api/courses` | GET | Browse all courses |
| `/api/courses?category=design` | GET | Filter by category |
| `/api/enroll` | POST | Enroll in a course |
| `/api/instructors` | GET | View creators |
| `/api/testimonials` | GET | Read reviews |

## 📁 Project Structure

```
TALEX/
├── new.html              # Landing page
├── styles.css            # Styles
├── script.js             # Frontend logic + API integration
├── img/                  # Course images
└── server/
    ├── server.js         # Express entry point
    ├── seed.js           # Database seeder
    ├── config/db.js      # JSON database engine
    ├── middleware/auth.js # JWT middleware
    └── routes/           # API route handlers
```

## 👤 Author

**Abhay Raj** — [@abhayraj-tech](https://github.com/abhayraj-tech)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
