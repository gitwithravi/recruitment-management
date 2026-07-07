# Recruitment Management Application

Internal recruitment workflow management app built with Next.js App Router, Tailwind CSS, shadcn/ui, PostgreSQL, and Prisma.

## Prerequisites

- Node.js 26+
- npm 11+
- Docker with Docker Compose

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

4. Generate the Prisma client:

   ```bash
   npm run db:generate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

The app runs at http://localhost:3000.

## Verification

```bash
npm run lint
npm run typecheck
npx prisma validate
```

## Project Layout

- `src/app` - Next.js App Router routes and layouts.
- `src/components` - shared UI and layout components.
- `src/lib` - shared framework-agnostic utilities.
- `src/server` - server-only helpers and application services.
- `src/db` - database client and persistence helpers.
- `src/features` - feature modules as phases are implemented.
- `prisma` - Prisma schema and migrations.

## Database

The local Docker service exposes PostgreSQL on `localhost:5432` with:

- database: `recruitment`
- user: `recruitment`
- password: `recruitment_password`

The matching connection string is stored in `.env.example`.
