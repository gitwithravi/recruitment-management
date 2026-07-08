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

5. Apply the database migration:

   ```bash
   npm run db:migrate
   ```

6. Seed the local admin account:

   ```bash
   npm run db:seed
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

The app runs at http://localhost:3000.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npx prisma validate
```

`npm run format:check` is also available for full-repo formatting checks.

## Project Layout

- `src/app` - Next.js App Router routes and layouts.
- `src/components` - shared UI and layout components.
- `src/lib` - shared framework-agnostic utilities.
- `src/server` - server-only helpers and application services.
- `src/db` - database client and persistence helpers.
- `src/features` - feature modules as phases are implemented.
- `tests` - Node test runner coverage for core business rules.
- `prisma` - Prisma schema and migrations.

## Database

The local Docker service exposes PostgreSQL on `localhost:5432` with:

- database: `recruitment`
- user: `recruitment`
- password: `recruitment_password`

The matching connection string is stored in `.env.example`.

Uploaded resumes and comment attachments are written under the local `storage/` directory and are served only through access-checked route handlers.

## Local Admin Login

After running `npm run db:seed`, the local admin account is:

- username: `admin`
- email: `admin@example.com`
- password: `Admin@123`

Change this password before using the app outside local development.

## Security Notes

- Login attempts are rate-limited in process by identifier and client IP.
- Mutations re-check server-side role or job access before writing.
- Resume uploads are limited to PDF, DOC, and DOCX files up to 10 MB.
- Comment attachments are limited to common document/image/text MIME types up to 25 MB.
