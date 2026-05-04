# ATS Resume Analyzer 🚀

A full-stack project that analyzes resumes and calculates ATS (Applicant Tracking System) scores based on job descriptions.

## 🔧 Backend Features
- User authentication (JWT)
- Resume upload (PDF)
- PDF parsing (text extraction)
- ATS score calculation
- Resume insights API

## 🌐 API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Resume
- POST /api/resume/upload
- GET /api/resume/insights
- GET /api/resume/:id

## 🛠️ Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Multer
- pdf-parse

## 🚀 How to Run Backend

```bash
cd backend
npm install
npm run dev
