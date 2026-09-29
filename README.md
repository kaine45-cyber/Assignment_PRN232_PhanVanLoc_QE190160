<div align="center">

# TaskTrack: Task & Team Management

**PRN232 · Assignment 1: Project Setup & Public CRUD**

A full-stack task management application built with an **ASP.NET Core 8 Web API**, a **PostgreSQL** database, and a **Next.js 15** frontend.

[![Backend CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml)
[![Frontend CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

</div>

---

## Table of contents

- [Live demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Assignment bonus features](#assignment-bonus-features)
- [Known limitations](#known-limitations)
- [Author](#author)

## Live demo

| Component | URL |
|---|---|
| Frontend (Vercel) | `https://<your-app>.vercel.app` |
| Backend API / Swagger (Render) | `https://<your-service>.onrender.com/swagger` |

> The backend runs on Render's free tier and sleeps when idle, so the first request can take up to about a minute.

## Screenshots

| Dashboard | Project board | Dark mode |
|---|---|---|
| ![Dashboard](frontend/docs/screenshots/dashboard-light.webp) | ![Project board](frontend/docs/screenshots/project-board.webp) | ![Dark mode](frontend/docs/screenshots/dashboard-dark.webp) |

More screenshots are in [`frontend/README.md`](frontend/README.md#screenshots).

## Features

**Backend (REST API)**
- Full CRUD for **Departments**, **Projects**, **Tasks** and **Tags**, with 24 public endpoints.
- Search and filter endpoints. Every parameter is optional, and text matching is partial and case-insensitive.
- Business rules:
  - A department or project cannot be deleted while records are still linked to it. The API returns `400` in that case.
  - A tag cannot be deleted while any task uses it.
  - Tasks are **soft-deleted** only.
- On update, a task's tags are replaced and `ModifiedDate` is refreshed.
- Field-level validation errors (`400`), consistent JSON error responses, and Swagger / OpenAPI documentation.

**Frontend (web app)**
- Dashboard with KPI cards, completion meter, tasks-by-status / priority charts, per-project progress and an overdue list.
- Public pages: Departments, Department detail, Projects, Project detail (table **or Kanban board**), Tasks (status filter), Task detail and Search (live filters synced to the URL).
- Management pages for all four entities: sortable, paginated tables; create / edit in modals; every delete asks for confirmation; tag multi-select; soft delete for tasks.
- Status and priority shown as coloured badges with icons, loading skeletons, toast notifications, client-side validation.
- Sidebar app shell, global search (<kbd>/</kbd>), light / dark theme, live API status indicator, fully responsive (375 px → desktop).

## Architecture

```mermaid
flowchart LR
    U([User]) --> FE["Next.js 15 frontend<br/>(Vercel)"]
    FE -- "REST / JSON" --> API

    subgraph BE["ASP.NET Core 8 backend (Render, Docker)"]
        API["TaskTrack.API<br/>Controllers · Middleware · Swagger"]
        SVC["TaskTrack.Service<br/>DTOs · Validation · Business rules"]
        REPO["TaskTrack.Repo<br/>EF Core · DbContext · Repositories"]
        API --> SVC --> REPO
    end

    REPO -- "Npgsql" --> DB[("PostgreSQL<br/>(Render)")]
```

The backend follows a strict **three-layer architecture**. Controllers depend only on services, and all database access goes through repositories. The frontend talks to the API through a single typed client (`frontend/lib/api.ts`).

### Data model

![Entity Relationship Diagram](backend/docs/erd.png)

Column reference and Mermaid source: [`backend/README.md`](backend/README.md#data-model) · [`backend/docs/erd.mmd`](backend/docs/erd.mmd).

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | ASP.NET Core 8 Web API, Entity Framework Core 8 (Database-First), Npgsql, Swashbuckle (Swagger) |
| Database | PostgreSQL |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, React Hook Form + Zod, Radix UI, Sonner, Lucide |
| DevOps | Docker, GitHub Actions, GitHub Container Registry, Dependabot, Render, Vercel |

## Repository structure

```
.
├── backend/                         ASP.NET Core solution (QE190160_SE19B_Ass1_BE.sln)
│   ├── TaskTrack.API/               Controllers, Program.cs, middleware, appsettings.json
│   ├── TaskTrack.Service/           DTOs, validation, services (business logic)
│   ├── TaskTrack.Repo/              EF Core entities, DbContext, repositories
│   ├── database/                    TaskManagementDB_Postgres.sql (provided, unmodified)
│   ├── docs/                        ERD image + Mermaid source
│   ├── Dockerfile
│   └── README.md                    Backend documentation (API reference, ERD)
├── frontend/                        Next.js application (QE190160_SE19B_Ass1_FE)
│   ├── app/                         Routes (App Router)
│   ├── components/                  Layout, UI kit, forms, domain components
│   ├── lib/                         API client, types, constants, hooks
│   ├── docs/                        ERD + screenshots
│   └── README.md                    Frontend documentation
└── .github/
    ├── workflows/backend.yml        Backend CI/CD pipeline
    ├── workflows/frontend.yml       Frontend CI/CD pipeline
    └── dependabot.yml               Automated dependency updates
```

## Getting started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) (22 LTS recommended)
- PostgreSQL 14+ (local install, Docker, or a Render database)

### 1. Database

Create a database and run the provided script. It creates all tables and inserts the seed data.

```bash
createdb TaskManagementDB
psql -d TaskManagementDB -f backend/database/TaskManagementDB_Postgres.sql
```

### 2. Backend

```bash
cd backend
# set ConnectionStrings:DefaultConnection in TaskTrack.API/appsettings.json
dotnet restore
dotnet run --project TaskTrack.API
```

The API is served at `http://localhost:5000`, with Swagger UI at `http://localhost:5000/swagger`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Configuration

| Variable | Used by | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | Backend | PostgreSQL connection string, stored in `appsettings.json` for local development |
| `DATABASE_URL` | Backend | Overrides the connection string. Render's `postgres://user:pass@host/db` URI is converted automatically |
| `CORS_ORIGINS` | Backend | Comma-separated list of allowed frontend origins |
| `ASPNETCORE_ENVIRONMENT` | Backend | `Development` locally, `Production` on Render |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL of the backend, without a trailing slash and without `/api` |

Templates are provided in `backend/.env.example` and `frontend/.env.example`. Real secrets are never committed.

## CI/CD

Two independent GitHub Actions pipelines use **path filters**, so a change in `backend/` only runs the backend pipeline, and the same holds for `frontend/`.

```mermaid
flowchart LR
    subgraph Backend["backend.yml"]
        B1[Restore] --> B2[Build Release] --> B3[Publish artifact] --> B4[Docker build<br/>push to GHCR on main] --> B5[Deploy to Render]
    end
    subgraph Frontend["frontend.yml"]
        F1[npm ci] --> F2[ESLint] --> F3[Type-check] --> F4[Next.js build] --> F5[Deploy to Vercel]
    end
```

| Trigger | Backend | Frontend |
|---|---|---|
| Pull request | Build, publish, Docker build (no push) | Lint, type-check, build |
| Push to `main` | Above steps, then push image `ghcr.io/<owner>/tasktrack-api:{latest,sha}`, then deploy | Above steps, then production deploy |
| Manual (`workflow_dispatch`) | Available | Available |

- **Continuous deployment is gated by CI.** The deploy jobs run only after every check passes.
- **Deploy jobs are optional.** When their secrets are not configured, the jobs skip with a notice instead of failing. Render and Vercel can then keep deploying through their own Git integration.
- **Dependabot** opens weekly PRs for NuGet and npm updates, and monthly PRs for GitHub Actions updates.

### Required secrets (Settings → Secrets and variables → Actions)

| Name | Type | Purpose |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Secret | Render → Web Service → Settings → *Deploy Hook* |
| `VERCEL_TOKEN` | Secret | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Secret | `orgId` in `.vercel/project.json` (after running `vercel link`) |
| `VERCEL_PROJECT_ID` | Secret | `projectId` in `.vercel/project.json` |
| `BACKEND_URL` | Variable (optional) | Render URL injected as `NEXT_PUBLIC_API_URL` during the CI build |

> If you use the GitHub Actions deploy, turn off *Auto-Deploy* on Render and the Git-triggered deployments on Vercel to avoid deploying twice.

## Deployment

### Backend and database: Render

1. **New → PostgreSQL** (Free).
   1. Connect with the *External Database URL*.
   2. Run `backend/database/TaskManagementDB_Postgres.sql`.
2. **New → Web Service**. Create it from this repository with these settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker
3. Set the service's environment variables:
   - `DATABASE_URL`: the *Internal Database URL*
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
4. Open `https://<service>.onrender.com/swagger` to confirm the API is running.

### Frontend: Vercel

1. **Add New → Project**. Import this repository.
2. Set **Root Directory** to `frontend`. Vercel detects Next.js as the framework.
3. Set the environment variable `NEXT_PUBLIC_API_URL=https://<service>.onrender.com`.
4. Deploy, then add the Vercel domain to `CORS_ORIGINS` on Render.

## Assignment bonus features

| Bonus item (Assignment 1) | Where |
|---|---|
| Status filter on the task list page | [`frontend/app/tasks/page.tsx`](frontend/app/tasks/page.tsx) — status tabs with live counts (also on `/tasks/manage`) |
| GitHub Actions CI on every push | [`backend.yml`](.github/workflows/backend.yml) (restore, build, publish, Docker) and [`frontend.yml`](.github/workflows/frontend.yml) (ESLint, type-check, build), plus CD to Render / Vercel and Dependabot |
| ERD diagram image in the README | [`backend/docs/erd.png`](backend/docs/erd.png) — shown in [Data model](#data-model) |

## Known limitations

- **Render cold starts.** Render's free instance sleeps after inactivity, so the first request may take 30–60 seconds. The UI shows a loading state while it waits.
- **Projects with tasks cannot be deleted.** Tasks are only ever soft-deleted, so the row stays in the database. The foreign key therefore keeps blocking deletion of the project, even if all of its tasks are soft-deleted. This is the expected result of the assignment's rules.
- **Free database lifetime.** Render's free PostgreSQL instances have a limited lifetime.
- **No authentication.** All endpoints are public by design. Authentication is planned for Assignment 2.

## Author

**Phan Văn Lộc** · QE190160 · SE19B
PRN232 · Assignment 1
