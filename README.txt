================================================================================
  ETHARA — AI-Powered Team Task Manager
================================================================================

GitHub:   https://github.com/shashwatpandey100/ethara-project
Frontend: https://ethara-client.vercel.app
Backend:  https://ethara-server.vercel.app

--------------------------------------------------------------------------------
  TEST CREDENTIALS
--------------------------------------------------------------------------------

  Email:    shashwatpandey100@gmail.com
  Password: Password@123

--------------------------------------------------------------------------------
  WHAT IT DOES
--------------------------------------------------------------------------------

  Ethara is a collaborative project and task management tool with AI-powered
  voice standups. Teams can:

  - Create and manage projects with Kanban task boards
  - Invite members and assign tasks with priorities and due dates
  - Record voice standups — AI transcribes them and extracts action items
  - Generate AI digests summarising project progress
  - Track standup history with per-item task creation from AI suggestions

--------------------------------------------------------------------------------
  TECH STACK
--------------------------------------------------------------------------------

  Frontend (project/client)
  ─────────────────────────
  - Next.js 15 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS v4
  - shadcn/ui + Radix UI
  - Better Auth (client SDK)
  - Sonner (toasts)
  - Lucide React (icons)

  Backend (project/server)
  ────────────────────────
  - Node.js + Express
  - TypeScript (ESM)
  - Better Auth v1.5 (auth framework)
  - Drizzle ORM
  - PostgreSQL (Supabase)
  - Deepgram (audio transcription)
  - Google Gemini (AI summary + task extraction)
  - Resend (transactional email / OTP)
  - Zod (env + request validation)
  - Helmet, express-rate-limit (security)

  Infrastructure
  ──────────────
  - Vercel (serverless deployment for both client and server)
  - Supabase (managed PostgreSQL)
  - Cloudinary (audio file storage for standups)

--------------------------------------------------------------------------------
  PROJECT STRUCTURE
--------------------------------------------------------------------------------

  project/
  ├── client/          Next.js frontend
  │   ├── src/
  │   │   ├── app/         Pages (dashboard, auth, join)
  │   │   ├── components/  UI components + common layout
  │   │   ├── contexts/    Session context
  │   │   ├── hooks/       Custom React hooks
  │   │   └── lib/         API client, auth client, utilities
  │   └── vercel.json
  │
  └── server/          Express API server
      ├── src/
      │   ├── app.ts          Express app setup
      │   ├── server.ts       Local dev entry (calls app.listen)
      │   ├── config/         Env validation (Zod)
      │   ├── controllers/    Route handlers
      │   ├── db/             Drizzle schema + client
      │   ├── lib/            Auth, Gemini, Deepgram, Resend
      │   ├── middleware/      Auth, rate limiter, logger, error handler
      │   └── routes/         Express routers
      ├── api/
      │   └── index.ts        Vercel serverless entry (exports app)
      └── vercel.json

--------------------------------------------------------------------------------
  LOCAL SETUP
--------------------------------------------------------------------------------

  Prerequisites
  ─────────────
  - Node.js 20+
  - npm
  - A PostgreSQL database (Supabase recommended)
  - Deepgram API key  →  https://deepgram.com
  - Gemini API key    →  https://aistudio.google.com
  - Resend API key    →  https://resend.com
  - Cloudinary account (free tier works)

  1. Clone the repo
  ─────────────────
  git clone https://github.com/shashwatpandey100/ethara-project.git
  cd ethara-project

  2. Set up the server
  ────────────────────
  cd server
  cp .env.example .env

  Edit .env and fill in:

    DATABASE_URL=postgresql://user:password@host:5432/dbname
    BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
    BETTER_AUTH_URL=http://localhost:8000
    CLIENT_URL=http://localhost:3000
    RESEND_API_KEY=re_xxxxxxxxxxxx
    RESEND_FROM_EMAIL=no-reply@yourdomain.com
    DEEPGRAM_API_KEY=xxxxxxxxxxxx
    GEMINI_API_KEY=xxxxxxxxxxxx

  Install dependencies and push DB schema:

    npm install
    npm run db:push

  Start the server:

    npm run dev
    # Runs on http://localhost:8000

  3. Set up the client
  ────────────────────
  cd ../client
  cp .env.example .env

  Edit .env:

    NEXT_PUBLIC_API_URL=http://localhost:8000
    NEXT_PUBLIC_APP_URL=http://localhost:3000

  Install dependencies and start:

    npm install
    npm run dev
    # Runs on http://localhost:3000

--------------------------------------------------------------------------------
  DEPLOYMENT (Vercel)
--------------------------------------------------------------------------------

  Both projects are deployed on Vercel connected to this GitHub repo.
  Any push to main auto-deploys via GitHub integration.

  Server env vars to set in Vercel (ethara-server project):
  ──────────────────────────────────────────────────────────
    DATABASE_URL       Supabase pooler URL (Transaction mode, port 6543)
    BETTER_AUTH_SECRET Random 32-char secret (openssl rand -base64 32)
    BETTER_AUTH_URL    https://ethara-server.vercel.app
    CLIENT_URL         https://ethara-client.vercel.app
    NODE_ENV           production
    RESEND_API_KEY     re_xxxxxxxxxxxx
    RESEND_FROM_EMAIL  no-reply@yourdomain.com
    DEEPGRAM_API_KEY   xxxxxxxxxxxx
    GEMINI_API_KEY     xxxxxxxxxxxx

  Client env vars to set in Vercel (ethara-client project):
  ──────────────────────────────────────────────────────────
    NEXT_PUBLIC_API_URL   https://ethara-server.vercel.app
    NEXT_PUBLIC_APP_URL   https://ethara-client.vercel.app

  IMPORTANT — Database:
  ─────────────────────
  Vercel serverless cannot reach Supabase's direct connection host
  (db.xxx.supabase.co). You MUST use the connection pooler URL:

    Supabase Dashboard → Settings → Database → Connection string
    → Select "Transaction" mode → Copy the URL (port 6543)

  The pooler URL looks like:
    postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres

--------------------------------------------------------------------------------
  API ENDPOINTS
--------------------------------------------------------------------------------

  Auth (via Better Auth)
    POST /api/auth/sign-up/email
    POST /api/auth/sign-in/email
    POST /api/auth/sign-out
    GET  /api/auth/get-session
    POST /api/auth/email-otp/send-verification-otp
    POST /api/auth/email-otp/verify-email

  Dashboard
    GET  /api/dashboard

  Projects
    GET  /api/projects
    POST /api/projects
    GET  /api/projects/:id
    PUT  /api/projects/:id
    DELETE /api/projects/:id
    POST /api/projects/:id/members
    DELETE /api/projects/:id/members/:userId

  Tasks
    GET  /api/projects/:id/tasks
    POST /api/projects/:id/tasks
    GET  /api/projects/:id/tasks/:taskId
    PUT  /api/projects/:id/tasks/:taskId
    DELETE /api/projects/:id/tasks/:taskId
    POST /api/projects/:id/tasks/:taskId/comments
    DELETE /api/projects/:id/tasks (bulk)

  Standups
    GET  /api/projects/:id/standups
    POST /api/projects/:id/standups
    GET  /api/projects/:id/standups/:standupId
    DELETE /api/projects/:id/standups/:standupId
    POST /api/projects/:id/standups/:standupId/confirm-tasks

  Health
    GET  /api/health

--------------------------------------------------------------------------------
  FEATURES IN DETAIL
--------------------------------------------------------------------------------

  Kanban Task Board
  - Four columns: To Do / In Progress / In Review / Done
  - Drag and drop between columns
  - Task detail dialog: comments, priority, assignee, due date
  - Bulk delete with checkbox selection

  Voice Standups
  - In-browser microphone recording with live waveform visualiser
  - Upload to Cloudinary → Deepgram transcription → Gemini AI summary
  - Structured summary: accomplishments, in-progress, blockers, decisions
  - AI-extracted tasks with priority and suggested assignee
  - One-click batch create tasks from standup suggestions

  AI Digest
  - Project-level AI summary generated on demand via Gemini
  - Summarises open tasks, recent activity, and blockers

  Auth
  - Email + password with OTP email verification
  - Username support (sign in with email or username)
  - Forgot password flow via email OTP
  - Session-based with cookie caching

================================================================================
