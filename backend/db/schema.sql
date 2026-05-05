CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  content TEXT,
  extractedtext TEXT,
  atsscore INT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  department VARCHAR(255),
  location VARCHAR(255),
  type VARCHAR(50),
  experience VARCHAR(50),
  salary VARCHAR(100),
  description TEXT,
  skills TEXT[],
  deadline DATE,
  min_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id INT REFERENCES users(id) ON DELETE CASCADE,
  resume_id INT REFERENCES resumes(id) ON DELETE SET NULL,
  ats_score INT,
  status VARCHAR(50) DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP,
  interviewer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin VARCHAR(255),
  current_role VARCHAR(255),
  experience VARCHAR(50),
  expected_salary VARCHAR(100),
  skills TEXT[],
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  company_website VARCHAR(255),
  company_size VARCHAR(50),
  default_interview_duration VARCHAR(50),
  resume_format VARCHAR(50),
  auto_screening BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  interview_reminders BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);
