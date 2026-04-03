# 🧠 Personal AI Assistant

A full-stack, AI-powered personal productivity dashboard that helps you track tasks, habits, sleep, fitness, goals, journal entries, and more — all with intelligent coaching and analytics.

## ✨ Features

- **📋 Task Management** — Create, prioritize, and complete tasks with project groupings
- **🎯 Goals Tracking** — SMART goals with milestones and progress tracking
- **📝 Journal** — AI-powered journaling with sentiment analysis and prompts
- **⏱️ Focus Sessions** — Pomodoro timer and deep work tracking
- **🏆 Achievements & XP** — Gamification system with levels and badges
- **🧠 AI Thought-to-Task** — Convert raw thoughts into structured tasks using AI
- **📊 Weekly Insights** — AI-generated productivity and wellness analytics
- **📅 Daily Plan** — AI-optimized daily schedules based on energy and priorities
- **🚭 Habit Tracker** — Track habits with trigger detection and coping strategies
- **😴 Sleep Tracker** — Log sleep quality and patterns
- **💪 Gym & Diet** — Workout and nutrition logging
- **📖 Daily Review** — Mood, energy, and reflection tracking
- **🔔 Smart Notifications** — Proactive habit trigger alerts
- **🎤 Voice Transcription** — Voice-to-text input

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TailwindCSS 4, Framer Motion, shadcn/ui, Recharts |
| **Backend** | Express.js, tRPC, Drizzle ORM |
| **Database** | MySQL |
| **Auth** | JWT-based session cookies (OAuth integration) |
| **AI** | LLM integration via Forge API (Gemini 2.5 Flash) |
| **Language** | TypeScript (full-stack) |

## 📁 Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages (15+ pages)
│       ├── contexts/     # Theme, auth contexts
│       ├── hooks/        # Custom React hooks
│       └── lib/          # tRPC client, utilities
├── server/               # Express + tRPC backend
│   ├── _core/            # Auth, OAuth, SDK, LLM, etc.
│   ├── routers.ts        # Main tRPC router
│   ├── routers_new.ts    # Goals, journal, focus, achievements
│   ├── routers_trigger.ts # Trigger detection router
│   └── triggerDetection.ts # Habit trigger analysis engine
├── shared/               # Shared types and constants
├── drizzle/              # Database schema and migrations
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm)
- MySQL database

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with required values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required environment variables.

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm check` | TypeScript type checking |
| `pnpm test` | Run unit tests (vitest) |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm format` | Format code with Prettier |

## 🔒 Security

- JWT-based authentication with signed session cookies
- Protected tRPC procedures with user context validation
- Input validation via Zod schemas on all endpoints
- Parameterized database queries via Drizzle ORM
- Security headers via Helmet.js
- Rate limiting on API endpoints
- CORS and cookie security configuration

## 📄 License

MIT
