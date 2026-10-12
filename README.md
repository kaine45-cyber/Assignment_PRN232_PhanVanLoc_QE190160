<div align="center">

# TaskTrack: Task & Team Management

**PRN232 · Assignment 2: Authentication, Authorization & Admin Panel**

A full-stack task management application built with an **ASP.NET Core 8 Web API**, a **PostgreSQL** database, and a **Next.js 15** frontend. Assignment 2 adds accounts, JWT authentication, role-based authorization and a protected admin panel on top of the Assignment 1 CRUD.

[![Backend CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml)
[![Frontend CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)

</div>

---

## Table of contents

- [Live demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Authentication & authorization](#authentication--authorization)
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
| Frontend (Vercel) | [assignment-prn-232-phan-van-loc-qe.vercel.app](https://assignment-prn-232-phan-van-loc-qe.vercel.app) |
| Backend API / Swagger (Render) | [tasktrack-api-ay24.onrender.com/swagger](https://tasktrack-api-ay24.onrender.com/swagger) |

| Test account | Email | Password |
|---|---|---|
| Admin (seeded by SQL) | `admin@tasktrack.dev` | `Admin@QE190160` |
| Staff (registered through `/register`) | `staff@tasktrack.dev` | `Staff@QE190160` |

> The backend runs on Render's free tier and sleeps when idle, so the first request can take up to about a minute.

## Screenshots

| Login | Admin dashboard | Account management (Admin) |
|---|---|---|
| ![Login](frontend/docs/screenshots/login.webp) | ![Admin dashboard](frontend/docs/screenshots/admin-dashboard.webp) | ![Accounts](frontend/docs/screenshots/admin-accounts.webp) |
| **Dashboard** | **Project board** | **Dark mode** |
| ![Dashboard](frontend/docs/screenshots/dashboard-light.webp) | ![Project board](frontend/docs/screenshots/project-board.webp) | ![Dark mode](frontend/docs/screenshots/dashboard-dark.webp) |

More screenshots are in [`frontend/README.md`](frontend/README.md#screenshots).

## Features

**Backend (REST API)**
- CRUD for **Departments**, **Projects**, **Tasks** and **Tags**. Reading (`GET`) is public; `POST`, `PUT` and `DELETE` require a valid JWT.
- **Accounts:** register, login, refresh, logout and profile endpoints (`/api/auth/*`), plus Admin-only account management (`/api/accounts`).
- Search and filter endpoints. Every parameter is optional, and text matching is partial and case-insensitive.
- Business rules:
  - A department or project cannot be deleted while records are still linked to it (`400`).
  - A tag cannot be deleted while any task uses it (`400`).
  - Tasks are **soft-deleted** only.
  - An account that has created tasks cannot be deleted (`409`).
- **Audit fields:** every task and project records who created it and who last updated it.
- Consistent JSON errors (`400`, `401`, `403`, `404`, `409`) and Swagger / OpenAPI documentation with an **Authorize** button.
- Integration tests (xUnit + `WebApplicationFactory`) run against a real PostgreSQL database in CI.
- **Automatic SQL migrations:** on startup the API runs the idempotent scripts in `backend/database/migrations/` (disable with `RUN_MIGRATIONS=false`).

**Frontend (web app)**
- Public pages: Dashboard, Departments, Department detail, Projects, Project detail (table **or Kanban board**), Tasks (status filter), Task detail and Search.
- `/register` (client-side validation, password confirmation), `/login` (clear error message, redirect back to the page you came from) and `/profile` (change name or password).
- Protected **admin panel**: `/admin` with summary cards, `/admin/departments`, `/admin/projects`, `/admin/tasks`, `/admin/tags`, and `/admin/accounts` for Admins only.
- The navbar shows the logged-in user with a Logout action, or Login / Register buttons.
- Expired sessions are refreshed silently; if that is not possible the user is sent to `/login`.
- Sortable, paginated tables; create / edit in modals; every delete asks for confirmation; toasts; light / dark theme; responsive from 375 px.

## Authentication & authorization

```mermaid
sequenceDiagram
    participant B as Browser (Next.js)
    participant A as API
    participant D as PostgreSQL
    B->>A: POST /api/auth/login {email, password}
    A->>D: find SystemAccount, verify BCrypt hash
    A-->>B: 200 {accessToken (JWT, 24 h), refreshToken (7 days), user}
    B->>A: POST /api/tasks with Authorization: Bearer JWT
    A-->>B: 201 Created (CreatedByID = AccountID from the token)
    Note over B,A: Access token expired → 401
    B->>A: POST /api/auth/refresh {refreshToken}
    A-->>B: new token pair (old refresh token revoked)
    Note over B: Refresh fails → session cleared → /login?reason=expired
```

| Endpoint group | Anonymous | Staff | Admin |
|---|---|---|---|
| `GET` departments / projects / tasks / tags | ✅ | ✅ | ✅ |
| `POST` / `PUT` / `DELETE` departments / projects / tasks / tags | `401` | ✅ | ✅ |
| `POST /api/auth/register`, `/login`, `/refresh`, `/logout` | ✅ | ✅ | ✅ |
| `GET` / `PUT /api/auth/me`, `PUT /api/auth/me/password` | `401` | ✅ | ✅ |
| `GET` / `PUT` / `DELETE /api/accounts` | `401` | `403` | ✅ |

- **Passwords** are hashed with **BCrypt** (work factor 11). Plain-text passwords are never stored or logged.
- **JWT** (HS256) carries `sub` / `accountId`, `email`, `name`, `role`, `jti` and `exp`. Issuer `TaskTrack.API`, audience `TaskTrack.Web`, lifetime 24 hours.
- **The signing secret is never committed.** It comes from the `JWT_SECRET` environment variable (Render) or from user-secrets locally. The API refuses to start if it is shorter than 32 characters.
- **Registration always creates a Staff account.** The Admin is inserted by the SQL migration [`backend/database/migrations/002_auth.sql`](backend/database/migrations/002_auth.sql). An Admin can promote other accounts in `/admin/accounts`.
- **Refresh tokens** are random 64-byte values stored only as SHA-256 hashes and rotated on every use. Re-using a revoked token revokes every session of that account.
- **Account safety rules:** an Admin cannot delete or demote their own account, and the last Admin can never be removed.

Full endpoint reference: [`backend/README.md`](backend/README.md#api-reference).

## Architecture

```mermaid
flowchart LR
    U([User]) --> FE["Next.js 15 frontend<br/>(Vercel)"]
    FE -- "REST / JSON + Bearer JWT" --> API

    subgraph BE["ASP.NET Core 8 backend (Render, Docker)"]
        API["TaskTrack.API<br/>Controllers · JWT auth · Middleware · Swagger"]
        SVC["TaskTrack.Service<br/>DTOs · Validation · Business rules · Auth"]
        REPO["TaskTrack.Repo<br/>EF Core · DbContext · Repositories"]
        API --> SVC --> REPO
    end

    REPO -- "Npgsql" --> DB[("PostgreSQL<br/>(Render)")]
```

The backend follows a strict **three-layer architecture**. Controllers depend only on services, and all database access goes through repositories. The frontend talks to the API through a single typed client (`frontend/lib/api.ts`) that attaches the token to every request.

### Data model

![Entity Relationship Diagram](backend/docs/erd.png)

Column reference and Mermaid source: [`backend/README.md`](backend/README.md#data-model) · [`backend/docs/erd.mmd`](backend/docs/erd.mmd).

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | ASP.NET Core 8 Web API, Entity Framework Core 8 (Database-First), Npgsql, JWT Bearer authentication, BCrypt.Net-Next, Swashbuckle (Swagger) |
| Tests | xUnit, `Microsoft.AspNetCore.Mvc.Testing` (integration tests against PostgreSQL) |
| Database | PostgreSQL |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, React Hook Form + Zod, Radix UI, Sonner, Lucide |
| DevOps | Docker, GitHub Actions, GitHub Container Registry, Dependabot, Render, Vercel |

## Repository structure

```
.
├── backend/                         ASP.NET Core solution (QE190160_SE19B_Ass1_BE.sln)
│   ├── TaskTrack.API/               Controllers, JWT setup, middleware, Program.cs
│   ├── TaskTrack.Service/           DTOs, validation, services, password hashing
│   ├── TaskTrack.Repo/              EF Core entities, DbContext, repositories
│   ├── TaskTrack.Tests/             Integration tests (auth flow, 401 / 403 rules)
│   ├── database/                    TaskManagementDB_Postgres.sql + migrations/002_auth.sql
│   ├── docs/                        ERD image + Mermaid source
│   ├── Dockerfile
│   └── README.md                    Backend documentation (API reference, ERD)
├── frontend/                        Next.js application
│   ├── app/                         Routes: public pages, /login, /register, /profile, /admin/*
│   ├── components/                  Layout, auth, UI kit, forms, domain components
│   ├── lib/                         API client, auth/session helpers, types, hooks
│   ├── middleware.ts                Redirects /admin/* and /profile to /login without a session
│   ├── docs/                        ERD + screenshots
│   └── README.md                    Frontend documentation
└── .github/
    ├── workflows/backend.yml        Backend CI/CD pipeline (build, tests, Docker, deploy)
    ├── workflows/frontend.yml       Frontend CI/CD pipeline (lint, type-check, build, deploy)
    └── dependabot.yml               Automated dependency updates
```

## Getting started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) (22 LTS recommended)
- PostgreSQL 14+ (local install, Docker, or a Render database)

### 1. Database

Create a database, run the provided script, then the Assignment 2 migration. The migration is idempotent: it creates `SystemAccount` and `RefreshToken`, adds the audit columns and seeds the Admin account.

```bash
createdb TaskManagementDB
psql -d TaskManagementDB -f backend/database/TaskManagementDB_Postgres.sql
psql -d TaskManagementDB -f backend/database/migrations/002_auth.sql
```

### 2. Backend

```bash
cd backend
# set ConnectionStrings:DefaultConnection in TaskTrack.API/appsettings.json, then store a JWT secret outside the repo:
dotnet user-secrets set "Jwt:Secret" "<at least 32 random characters>" --project TaskTrack.API
dotnet run --project TaskTrack.API
```

The API is served at `http://localhost:5000`, with Swagger UI at `http://localhost:5000/swagger`. Run the tests with `dotnet test` (they need the database above and `JWT_SECRET` or the user secret).

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Log in with the Admin account, or create a Staff account at `/register`.

## Configuration

| Variable | Used by | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | Backend | PostgreSQL connection string, stored in `appsettings.json` for local development |
| `DATABASE_URL` | Backend | Overrides the connection string. Render's `postgres://user:pass@host/db` URI is converted automatically |
| `JWT_SECRET` | Backend | **Required.** Key used to sign JWTs, at least 32 characters (64 random characters recommended). Overrides `Jwt:Secret` |
| `CORS_ORIGINS` | Backend | Comma-separated list of allowed frontend origins |
| `RUN_MIGRATIONS` | Backend | `false` turns off the startup migration runner (default: on) |
| `ASPNETCORE_ENVIRONMENT` | Backend | `Development` locally, `Production` on Render |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL of the backend, without a trailing slash and without `/api` |

Token lifetimes can be changed with `Jwt:AccessTokenMinutes` (default 1440) and `Jwt:RefreshTokenDays` (default 7). Templates are provided in `backend/.env.example` and `frontend/.env.example`. Real secrets are never committed.

## CI/CD

Two independent GitHub Actions pipelines use **path filters**, so a change in `backend/` only runs the backend pipeline, and the same holds for `frontend/`.

```mermaid
flowchart LR
    subgraph Backend["backend.yml"]
        B1[Restore + build] --> B2[Integration tests<br/>PostgreSQL service] --> B3[Docker build<br/>push to GHCR on main] --> B4[Deploy to Render]
    end
    subgraph Frontend["frontend.yml"]
        F1[npm ci] --> F2[ESLint] --> F3[Type-check] --> F4[Next.js build] --> F5[Deploy to Vercel]
    end
```

| Trigger | Backend | Frontend |
|---|---|---|
| Pull request | Build, publish, integration tests, Docker build (no push) | Lint, type-check, build |
| Push to `main` | Above steps, then push image `ghcr.io/<owner>/tasktrack-api:{latest,sha}`, then deploy | Above steps, then production deploy |
| Manual (`workflow_dispatch`) | Available | Available |

- **The test job** starts a `postgres:16` service, applies `TaskManagementDB_Postgres.sql` and every file in `database/migrations/`, then runs `dotnet test`.
- **Continuous deployment is gated by CI.** The deploy jobs run only after every check passes.
- **Deploy jobs are optional.** When their secrets are not configured, the jobs skip with a notice instead of failing. Render and Vercel can then keep deploying through their own Git integration.
- **Dependabot** opens PRs for NuGet, npm and GitHub Actions updates.

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
   1. Connect with the *External Database URL* (for example from pgAdmin, SSL mode `require`).
   2. Run `backend/database/TaskManagementDB_Postgres.sql`. The Assignment 2 migration (`backend/database/migrations/002_auth.sql`) is applied automatically when the API starts; you can also run it yourself.
2. **New → Web Service**. Create it from this repository with these settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker
3. Set the service's environment variables:
   - `DATABASE_URL`: the *Internal Database URL*
   - `JWT_SECRET`: a random string of 64 characters (for example the output of `openssl rand -base64 48`)
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
4. Open `https://<service>.onrender.com/swagger`. The **Authorize** button accepts the `accessToken` returned by `POST /api/auth/login`.

### Frontend: Vercel

1. **Add New → Project**. Import this repository.
2. Set **Root Directory** to `frontend`. Vercel detects Next.js as the framework.
3. Set the environment variable `NEXT_PUBLIC_API_URL=https://<service>.onrender.com`.
4. Deploy, then add the Vercel domain to `CORS_ORIGINS` on Render.
5. Create the Staff test account through `https://<your-app>.vercel.app/register`.

## Assignment bonus features

| Bonus item (Assignment 2) | Where |
|---|---|
| Refresh token | `POST /api/auth/refresh` with rotation, SHA-256 storage and reuse detection. The frontend refreshes silently one minute before `exp` and once after a `401` |
| User profile page | `/profile`: update full name and change password (`PUT /api/auth/me`, `PUT /api/auth/me/password`) |
| Audit fields | `CreatedByID` / `UpdatedByID` on `Task` and `Project`, filled from the token and shown as *Created by* / *Last edited by* |
| GitHub Actions CI | Backend: build, integration tests on PostgreSQL, Docker. Frontend: ESLint, type-check, build |

The Assignment 1 bonus items (status filter on the task list, CI on every push, ERD image) are still in place.

## Known limitations

- **Render cold starts.** Render's free instance sleeps after inactivity, so the first request may take 30–60 seconds. The UI shows a loading state while it waits.
- **Free database lifetime.** Render's free PostgreSQL instances expire after a limited time.
- **Tokens are kept in `localStorage`.** This works across the Vercel and Render domains without third-party cookies, but it is more exposed to XSS than an `HttpOnly` cookie. The short-lived access token, refresh-token rotation and React's output escaping reduce the risk.
- **Route protection in the browser is a convenience.** Next.js middleware redirects `/admin/*` and `/profile` to `/login` when the session-marker cookie is missing. The real security boundary is the API, which always answers `401` / `403`.
- **Logging out ends the current session only.** The access token stays valid until it expires (stateless JWT); the refresh token is revoked immediately. Changing the password revokes every refresh token.
- **Projects with tasks cannot be deleted.** Tasks are only ever soft-deleted, so the row stays in the database and the foreign key keeps blocking deletion of the project. This follows from the assignment's rules.

## Author

**Phan Văn Lộc** · QE190160 · SE19B
PRN232 · Assignment 2
