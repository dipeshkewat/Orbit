# SocialSphear

AI-powered social media management and scheduling platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS v4 + Shadcn/UI |
| Backend | NestJS + tRPC + BullMQ + Temporal |
| Database | PostgreSQL (Supabase) + ClickHouse Cloud |
| Cache | Redis (Upstash) |
| AI | Anthropic Claude + fal.ai + Vercel AI SDK |
| Auth | Clerk |
| Payments | Stripe |
| Hosting | Vercel (frontend) + Railway (backend) |

## Monorepo Structure

```
├── apps/
│   ├── web/        # Next.js 15 frontend
│   └── api/        # NestJS backend
├── packages/
│   ├── types/      # Shared Zod schemas + TypeScript types
│   ├── db/         # Prisma schema, client, migrations
│   ├── ui/         # Shared Shadcn/UI components
│   ├── config/     # Base ESLint, TypeScript, Tailwind configs
│   └── ai/         # Vercel AI SDK wrappers
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL + Redis)

### Setup

```bash
# Clone the repo
git clone https://github.com/socialsphear/socialsphear.git
cd socialsphear

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start local database and Redis
docker compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:push

# Start development servers
pnpm dev
```

The frontend runs on `http://localhost:3000` and the API on `http://localhost:3001`.

### Key Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript strict check all packages |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:migrate` | Run production migrations |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Architecture

- **tRPC** is used for internal frontend↔backend API calls (type-safe, no schema drift)
- **REST API** at `api.socialsphear.com/v1` is a separate NestJS controller layer for the public API
- **BullMQ** handles all job queues (6 queues for scheduling, publishing, analytics, etc.)
- **Temporal** orchestrates complex workflows (recurring posts, token refresh, etc.)
- **ClickHouse** stores analytics data for fast aggregation queries
- All OAuth tokens are **AES-256-GCM encrypted** before database storage

## License

Proprietary — All rights reserved.
