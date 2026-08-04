# HireFlow

A lightweight AI-assisted interview scheduling & candidate screening tool for HR teams.

Built for small-to-medium teams who want structured hiring workflows without the complexity of enterprise ATS systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Online Demo**: [hireflow-iota-ochre.vercel.app](https://hireflow-iota-ochre.vercel.app)

---

## Features

- **Job Management** — Create and manage job openings with full JD descriptions for AI matching
- **Candidate Tracking** — Add candidates with resume text, status tracking (screening → interview → offer → hired), and source attribution
- **Multi-round Interview Scheduling** — Schedule multiple interview rounds per candidate with interviewer assignment, type selection (video/phone/onsite), and timeline view
- **Structured Feedback** — Interviewers submit ratings (1-5), strengths, and concerns for each completed interview. **AI Interview Assessment**: upload TXT interview notes and let AI generate a feedback draft based on the job description
- **AI Job Matching** — Paste a resume or upload a PDF, and AI evaluates fit against all open positions with scores, strengths, concerns, and recommendations (Recommended / Consider / Not Recommended)
- **AI Smart Onboarding** — Upload a resume PDF, and AI auto-extracts candidate info (name, phone, email) and matches against all open positions in one click
- **Dashboard & Pending Feedback Alerts** — Overview of open positions, candidates in pipeline, and a prominent alert for interviews that still need feedback
- **Status Workflow with Rules** — Auto-transition from screening to interviewing when scheduling; locked states (e.g., can't offer without completed interview + feedback)
- **PDF Resume Support** — Upload PDF resumes with automatic text extraction (pdfjs) and OCR fallback for scanned documents (tesseract.js)
- **Neumorphic UI** — Clean, soft-shadow card-based design with responsive layout

---

## Screenshots

| Dashboard | Job Listings |
|-----------|-------------|
| ![Dashboard](/screenshots/home.png) | ![Jobs](/screenshots/jobs.png) |

| Candidates | Candidate Detail |
|-----------|-----------------|
| ![Candidates](/screenshots/candidates.png) | ![Detail](/screenshots/candidate-detail.png) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Drizzle ORM |
| Database (local) | SQLite (better-sqlite3) |
| Database (production) | Turso (libsql) |
| PDF Processing | pdfjs-dist |
| OCR | tesseract.js |
| AI Integration | DeepSeek (OpenAI-compatible) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Local Development

```bash
git clone https://github.com/tanqii77-design/Hireflow.git
cd hireflow
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

Local development uses SQLite automatically. For production, HireFlow supports [Turso](https://turso.tech) (cloud SQLite):

```
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

Run `npx tsx src/db/migrate-turso.ts` to sync schema to the cloud.

### Demo Data

```bash
npx tsx src/db/seed.ts
```

Populates the database with 3 jobs, 6 candidates, 10 interviews, feedback, and AI match records.

---

## AI Features Configuration

AI features are optional. When not configured, the UI shows friendly prompts and all other features work normally.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_API_KEY` | For AI features | — | Your DeepSeek API key (or any OpenAI-compatible provider) |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | API endpoint (supports any OpenAI-compatible service) |
| `LLM_MODEL` | No | `deepseek-chat` | Model name to use |

Add these to your `.env.local`:

```
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── page.tsx            # Dashboard
│   ├── jobs/               # Job management pages
│   ├── candidates/         # Candidate management pages
│   ├── api/                # API routes (resume PDF serving, etc.)
│   └── layout.tsx          # Root layout with navigation
├── components/             # Reusable UI components
│   ├── breadcrumb.tsx      # Breadcrumb navigation
│   ├── modal.tsx           # Modal dialog
│   ├── pdf-uploader.tsx    # PDF upload with OCR
│   └── pdf-preview.tsx     # PDF page preview
├── db/                     # Database layer
│   ├── schema.ts           # Drizzle schema (6 tables)
│   ├── index.ts            # Connection (local SQLite / Turso)
│   ├── migrate-turso.ts    # Turso schema migration
│   ├── seed.ts             # Demo data
│   └── cleanup.ts          # Data cleanup
├── lib/                    # Shared utilities
│   └── llm.ts              # LLM integration (matching + info extraction)
└── app/globals.css         # Global styles (neumorphic design system)
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
