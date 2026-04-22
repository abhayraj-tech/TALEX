# TALEX Backend API

Node.js + Express + MongoDB backend for the TALEX skill-learning platform.

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, SMTP credentials, and OAuth keys
```

### 3. Start MongoDB
Make sure MongoDB is running locally, or use a MongoDB Atlas connection string in `.env`.

### 4. Seed the database (optional)
```bash
node seed.js
```

### 5. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server runs on **http://localhost:5000** and also serves the frontend `index.html`.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register with name, email, password |
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/logout` | Logout (client discards token) |
| GET  | `/api/auth/me` | Get current user (requires token) |
| GET  | `/api/auth/google` | Start Google OAuth flow |
| GET  | `/api/auth/github` | Start GitHub OAuth flow |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List courses (filter: category, difficulty, free, search, sort) |
| GET | `/api/courses/:id` | Get single course |

### Badges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges` | List all badges (filter: tier, category) |
| GET | `/api/badges/:id` | Get single badge |

### User (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/credits` | Get credit balance + transaction history |
| GET | `/api/user/badges` | Get user's earned badges |
| GET | `/api/user/courses` | Get enrolled/completed courses |
| GET | `/api/user/profile` | Get full profile |
| PATCH | `/api/user/profile` | Update profile |

### Jobs & Hiring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (filter: badges, skills, location, type) |
| POST | `/api/jobs` | Post a job (requires JWT) |
| POST | `/api/jobs/match` | AI match user to jobs (requires JWT) |
| GET | `/api/jobs/candidates` | Search candidates by badges/skills (requires JWT) |

### Waitlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waitlist` | Join waitlist with email |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs + Passport.js (Google & GitHub OAuth)
- **Email:** Nodemailer (SMTP)
- **Validation:** express-validator
- **Security:** helmet, cors, express-rate-limit
