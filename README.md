# CareersFit — ATS Resume Analyzer

Full-stack hiring platform with role-based flows for **job seekers** and **recruiters**.

## Features

**Job Seeker**
- Sign up / login (role: user)
- Resume builder with PDF download + save-to-account
- Public ATS scanner (no login required)
- Browse jobs, filter, apply with resume → auto-scored against the JD
- Personal profile with skills, stats (best ATS, applied, shortlisted)

**Recruiter**
- Sign up / login (role: recruiter)
- Post / delete jobs
- See all applicants for own jobs, change status (applied → shortlisted → interview → hired/rejected)
- Schedule and update interviews
- Analytics dashboard (applications per job, pipeline funnel, monthly trend, success rate)
- Account & company settings, password change

## Tech Stack
- **Backend** — Node.js, Express, PostgreSQL, JWT, bcrypt, Multer, pdf-parse
- **Frontend** — Static HTML/CSS/vanilla JS (Chart.js, jsPDF), served from same origin
- **Auth** — JWT in localStorage, role enforced on backend with middleware

## Setup

```bash
cd backend
cp .env.example .env       # then edit with your Postgres creds
npm install
npm run dev
```

The server starts on `http://localhost:5001`, auto-runs `db/schema.sql`, and serves the frontend at `/`. Open <http://localhost:5001/loginpage.html>.

> macOS note: port 5000 is hijacked by the AirPlay Receiver. Default is 5001; override via `PORT=` in `.env`.

## API

### Auth
- `POST /api/auth/register` — `{name,email,password,role}` (`role` is `user` or `recruiter`)
- `POST /api/auth/login` — returns `{token, user}`
- `GET  /api/auth/me`

### Resume
- `POST /api/resume/analyze` — public, multipart `resume` + `jobDescription`
- `POST /api/resume/upload` — auth, saves to DB
- `GET  /api/resume/my`, `GET /api/resume/:id`, `DELETE /api/resume/:id`
- `GET  /api/resume/insights`
- `POST /api/resume/:id/recalculate`
- `GET  /api/resume/:id/download`

### Jobs
- `GET  /api/jobs` — list (auth)
- `GET  /api/jobs/mine` — recruiter's own
- `GET  /api/jobs/:id`
- `POST /api/jobs` — recruiter
- `DELETE /api/jobs/:id` — recruiter

### Applications
- `POST /api/applications` — user, multipart `resume` + `job_id`, OR JSON `{job_id, resume_id}`
- `GET  /api/applications/mine`
- `GET  /api/applications/recruiter` — all applicants on recruiter's jobs
- `PUT  /api/applications/:id/status` — recruiter

### Interviews
- `GET  /api/interviews`
- `POST /api/interviews` — recruiter
- `PUT  /api/interviews/:id` — recruiter

### Profile / Settings / Analytics
- `GET/PUT /api/profile`
- `GET/PUT /api/settings`
- `GET /api/analytics/recruiter`, `GET /api/analytics/me`

## Database

Tables auto-created on boot via [backend/db/schema.sql](backend/db/schema.sql):
`users`, `resumes`, `jobs`, `applications`, `interviews`, `profiles`, `settings`.
