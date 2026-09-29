# HireReach AI

HireReach AI is an AI-powered HR discovery and personalized email automation
platform. It helps users discover HR contacts and prepare personalized outreach
emails.

This repository is being built in stages. **Stage 1** sets up the project
foundation: the frontend UI, a basic Express backend, and Prisma configuration.

> Stage 1 is UI and scaffolding only. Google authentication, web scraping,
> Google Sheets import, AI email generation, and email sending are planned for
> later stages and are not functional yet.

## Project structure

```
.
├── frontend/   React + Vite + Tailwind CSS UI
└── backend/    Express API + Prisma (PostgreSQL)
```

## Prerequisites

- Node.js 18+ (developed on Node 22)
- PostgreSQL (only needed when you run Prisma migrations)

## Frontend

```bash
cd frontend
npm install
cp .env.example .env      # optional, defaults work for local dev
npm run dev               # start dev server at http://localhost:5173
npm run build             # production build
```

Environment variables (`frontend/.env`):

- `VITE_API_URL` — base URL of the backend API (default `http://localhost:4000`)

## Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in your values
npm run dev               # start API at http://localhost:4000
```

Environment variables (`backend/.env`):

- `PORT` — port for the Express server (default `4000`)
- `FRONTEND_URL` — allowed CORS origin (default `http://localhost:5173`)
- `DATABASE_URL` — PostgreSQL connection string for Prisma

Health check:

```
GET http://localhost:4000/api/health
{ "success": true, "message": "HireReach AI API is running" }
```

## Database (Prisma)

The Prisma schema defines a minimal `User` model in
`backend/prisma/schema.prisma`. To connect a database, set a valid
`DATABASE_URL` in `backend/.env`, then run:

```bash
cd backend
npm run prisma:generate   # generate the Prisma client
npm run prisma:migrate    # create/apply migrations (requires a live database)
```
