# TaskScribe — AI-Powered Team Task Manager

A full-stack web application for teams to create projects, assign tasks, and track progress with role-based access control (Admin/Member) and AI-powered capabilities.

## Live Demo

🌐 **[taskscribe.up.railway.app](https://taskscribe.up.railway.app)** *(to be deployed)*

## Features

### Core
- **Authentication** — Email/password signup + OTP email verification + password reset
- **Projects** — Create, update, archive, and delete projects
- **Team Management** — Invite members via shareable link, Admin/Member roles
- **Tasks** — Kanban board (TODO → In Progress → In Review → Done), priorities, due dates, assignees, comments
- **Dashboard** — My tasks overview, overdue alerts, recent activity feed

### AI Features (Google Gemini + Deepgram)
- **AI Voice Standup** — Submit an audio URL → Deepgram transcribes with speaker diarization → Gemini extracts structured action items and creates tasks automatically
- **AI Project Digest** — One-click AI-generated project status report with progress overview, active work, at-risk items, and recommendations

## Tech Stack

### Server
| | |
|---|---|
| Runtime | Node.js + TypeScript ESM |
| Framework | Express 4 |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Better Auth (email/password + OTP) |
| AI Transcription | Deepgram nova-3 (diarization) |
| AI Generation | Google Gemini 2.5-flash-lite |
| Email | Resend |
| Security | Helmet, express-rate-limit, CORS |

### Client
| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS 4 |
| UI Components | Shadcn/ui (Radix primitives) |
| Auth | Better Auth client |
| Charts | Recharts |
| Toasts | Sonner |

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- API keys: Deepgram, Gemini, Resend

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in your env vars
npm run db:push    # Push schema to DB
npm run dev        # Start dev server on :8000
```

### Client Setup

```bash
cd client
npm install
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev        # Start dev server on :3000
```

## Environment Variables

### Server `.env`
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
DEEPGRAM_API_KEY=...
GEMINI_API_KEY=...
```

### Client `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Reference

### Auth
All auth handled by Better Auth at `/api/auth/*`

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details + members |
| PATCH | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (creator) |
| POST | `/api/projects/:id/invite` | Generate invite link |
| GET | `/api/projects/invite/:code` | Get invite info |
| POST | `/api/projects/join/:code` | Join via invite |
| DELETE | `/api/projects/:id/members/:memberId` | Remove member |
| PATCH | `/api/projects/:id/members/:memberId/role` | Update member role |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/tasks` | List tasks |
| POST | `/api/projects/:projectId/tasks` | Create task (admin) |
| GET | `/api/projects/:projectId/tasks/:taskId` | Get task + comments |
| PATCH | `/api/projects/:projectId/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete task (admin) |
| POST | `/api/projects/:projectId/tasks/bulk-delete` | Bulk delete (admin) |
| POST | `/api/projects/:projectId/tasks/:taskId/comments` | Add comment |

### Standups (AI)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/standups` | List standups |
| POST | `/api/projects/:projectId/standups` | Create standup (triggers AI pipeline) |
| GET | `/api/projects/:projectId/standups/:standupId` | Get standup + extracted tasks |
| POST | `/api/projects/:projectId/standups/:standupId/confirm-tasks` | Create tasks from extraction |
| DELETE | `/api/projects/:projectId/standups/:standupId` | Delete standup |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | My stats, overdue tasks, activity |
| GET | `/api/dashboard/projects/:projectId/digest` | AI project digest |

## Deployment (Railway)

### 1. Create Railway project
```bash
railway login
railway init
```

### 2. Add PostgreSQL
- In Railway dashboard → Add Service → Database → PostgreSQL
- Copy `DATABASE_URL` from connection settings

### 3. Deploy Server
```bash
cd server
railway up
```
Set environment variables in Railway dashboard (all vars from `.env.example`)

### 4. Deploy Client
```bash
cd client
railway up
```
Set `NEXT_PUBLIC_API_URL` to your Railway server URL.

## Role-Based Access

| Action | Admin | Member |
|---|---|---|
| View project + tasks | ✅ | ✅ |
| Update task status (assigned) | ✅ | ✅ |
| Create tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Manage members | ✅ | ❌ |
| Generate invite links | ✅ | ❌ |
| Submit standups | ✅ | ❌ |
| Confirm AI tasks | ✅ | ❌ |
| Delete project | Creator only | ❌ |

## AI Pipeline

### Voice Standup Pipeline (Fire-and-Forget)
```
User submits audio URL
    ↓
Standup record created (status: "processing")
    ↓ (async, background)
Deepgram nova-3 transcribes with speaker diarization
    ↓
Gemini 2.5-flash-lite generates standup summary (HTML)
    ↓ (in parallel with summary)
Gemini 2.5-flash-lite extracts structured tasks (JSON)
    ↓
Standup updated (status: "completed", transcript, summary, extractedTasks)
    ↓
User reviews extracted tasks → selects → confirms → tasks created
```

### AI Digest Pipeline (On-demand)
```
User clicks "AI Digest"
    ↓
Server fetches all project tasks with stats
    ↓
Gemini 2.5-flash-lite generates status report (HTML)
    ↓
Rendered in dialog
```
