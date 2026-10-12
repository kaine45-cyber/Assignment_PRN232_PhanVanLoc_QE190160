<div align="center">

# TaskTrack Web

**PRN232 · Assignment 2: Task & Team Management (Frontend)**

The web client for TaskTrack — a dashboard-style app built with **Next.js 15 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS 4**. Every page loads real data from the TaskTrack API. Assignment 2 adds registration, login, a protected admin panel and account management.

[![CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/frontend.yml)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

| | |
|---|---|
| **Live site** | [assignment-prn-232-phan-van-loc-qe.vercel.app](https://assignment-prn-232-phan-van-loc-qe.vercel.app) |
| **Backend (same repository)** | [`backend/`](../backend) |
| **Backend API (Swagger)** | [tasktrack-api-ay24.onrender.com/swagger](https://tasktrack-api-ay24.onrender.com/swagger) |
| **Test accounts** | Admin `admin@tasktrack.dev` / `Admin@QE190160` · Staff `staff@tasktrack.dev` / `Staff@QE190160` |

> The backend runs on Render's free tier, so the first request after a period of inactivity can take up to a minute. The UI shows a loading state meanwhile.

## Contents

- [Screenshots](#screenshots)
- [Pages](#pages)
- [Authentication](#authentication)
- [UI & UX](#ui--ux)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Assignment bonus features](#assignment-bonus-features)
- [Author](#author)

## Screenshots

| Login | Register |
|---|---|
| ![Login](docs/screenshots/login.webp) | ![Register](docs/screenshots/register.webp) |
| **Admin dashboard** | **Account management (Admin only)** |
| ![Admin dashboard](docs/screenshots/admin-dashboard.webp) | ![Accounts](docs/screenshots/admin-accounts.webp) |
| **Dashboard (light)** | **Dashboard (dark)** |
| ![Dashboard – light](docs/screenshots/dashboard-light.webp) | ![Dashboard – dark](docs/screenshots/dashboard-dark.webp) |
| **Project detail – Kanban board** | **Task management** |
| ![Project board](docs/screenshots/project-board.webp) | ![Task management](docs/screenshots/tasks-manage.webp) |
| **Search with live filters** | **Create task modal (dark)** |
| ![Search](docs/screenshots/search.webp) | ![Task modal](docs/screenshots/task-modal-dark.webp) |

<p align="center"><img src="docs/screenshots/mobile.webp" alt="Mobile layout" width="260" /></p>

## Pages

### Public

| Route | Description |
|---|---|
| `/` | Dashboard: welcome banner, KPI cards (departments, projects, tasks, overdue), completion meter, *tasks by status / priority* charts, per-project progress, overdue list and active projects as cards |
| `/departments` | Active departments as cards, with a live name search |
| `/departments/[id]` | Department info, project / task counts and its projects |
| `/projects` | Active projects, filterable by name, status and department |
| `/projects/[id]` | Project details, progress, stats and its tasks as a **sortable table or a Kanban board** (status badge, priority badge, tags, due date) |
| `/tasks` | Every active task with a **status filter** (tabs with counts), priority and title filters, sorting and pagination |
| `/tasks/[id]` | All fields of a task including tags, with an overdue warning |
| `/search` | Filter tasks by title, status, priority, project and tag. Results update as filters change and are synced to the URL (shareable) |

### Account

| Route | Description |
|---|---|
| `/register` | Full name, email, password and confirmation, validated with Zod. A duplicate email (`409`) is shown under the email field. On success the user is sent to `/login` with a confirmation banner |
| `/login` | Stores the JWT and redirects to `/admin` (or back to the protected page that sent the user here). Wrong credentials show a clear error |
| `/profile` | 🔑 Update full name, change password (changing it logs out every session) |

### Admin panel (login required)

`/admin/*` requires a session. Without one, the user is redirected to `/login?next=…`. The old `/{entity}/manage` URLs redirect here.

| Route | Features |
|---|---|
| `/admin` | Welcome header with role badge, summary cards (departments, projects, tasks, tags) and links to every management page |
| `/admin/accounts` | 👑 Admin only (Staff see a 403 page): list with role filter and task counts, edit name / role in a modal, delete with confirmation. Your own account cannot be deleted or demoted, and accounts that created tasks show the API's `409` message |
| `/admin/departments` | Sortable table, create / edit in a modal, delete with confirmation, active/inactive filter |
| `/admin/projects` | Sortable table, create / edit in a modal (date-range validation), delete with confirmation, status & department filters |
| `/admin/tasks` | Sortable table with a *Created by* column, create / edit in a modal with **tag multi-select**, **soft delete** with confirmation, status tabs. `?new=1&projectId=` deep link opens the create form |
| `/admin/tags` | Sortable table, color picker with presets and live preview, delete with confirmation |

## Authentication

- **Session storage.** After login, the access token, refresh token and user are stored in `localStorage` (`lib/auth.ts`). A small `tt_session` marker cookie (no token inside) lets `middleware.ts` redirect `/admin/*` and `/profile` to `/login` before the page renders.
- **Authorized requests.** `lib/api.ts` adds `Authorization: Bearer <token>` to every request.
- **Token expiry.** `AuthProvider` schedules a silent refresh one minute before the token's `exp`. If a request still gets `401`, the client makes one refresh attempt (shared by concurrent requests) and retries; if that fails, the session is cleared and the user is redirected to `/login?reason=expired`.
- **Route guard.** `RequireAuth` protects `/admin/*` and `/profile` on the client, and shows a 403 page to Staff on `/admin/accounts`. The API remains the real security boundary.
- **Navbar.** Logged in: avatar, name, role and a menu with *Admin dashboard*, *Accounts* (Admin), *My profile* and **Logout** (revokes the refresh token and returns to the home page). Logged out: **Login** and **Register** buttons.

## UI & UX

- **App shell** — fixed sidebar navigation (drawer on mobile), top bar with global task search (press <kbd>/</kbd>), quick "New task" action and a live **API status** indicator (the Render instance may be asleep).
- **Light & dark theme** — design tokens as CSS variables, toggle in the top bar, remembers the choice and follows the OS by default.
- **Badges, not numbers** — status badges carry an icon + label, priority badges a 4-step signal indicator, so meaning never relies on colour alone.
- **Data tables** — generic `DataTable` with sortable columns, pagination and empty states; switches to compact cards on small screens.
- **Charts** — lightweight, dependency-free bar lists and meters built from a validated data-viz palette.
- **Feedback** — skeleton loaders and spinners during requests, [Sonner](https://sonner.emilkowal.ski/) toasts after every create / update / delete (including API `400` messages such as *"still has projects linked"*).
- **Dialogs** — [Radix UI](https://www.radix-ui.com/) modals and confirmation dialogs (focus-trapped, <kbd>Esc</kbd> to close).
- **Validation** — React Hook Form + Zod on the client; field errors returned by the API are shown under the matching input.
- **Responsive** — tested at 375 px, 390 px and 1440 px with no horizontal scrolling.

## Data model

![Entity Relationship Diagram](docs/erd.png)

## Project structure

```
.
├── app/                        App Router routes
│   ├── page.tsx                Dashboard
│   ├── departments/            List, [id] detail
│   ├── projects/               List, [id] detail (table / board)
│   ├── tasks/                  List (status filter), [id] detail
│   ├── search/                 Task search
│   ├── login/ register/        Authentication pages
│   ├── profile/                Profile + change password
│   ├── admin/                  Dashboard, departments, projects, tasks, tags, accounts (guarded by layout.tsx)
│   └── layout.tsx              Fonts, theme bootstrap, app shell, toaster
├── components/
│   ├── auth/                   AuthProvider (useAuth), RequireAuth, AuthCard, PasswordInput
│   ├── layout/                 AppShell, Sidebar, Topbar, UserMenu, ThemeToggle, ApiStatus
│   ├── ui/                     DataTable, Modal, ConfirmDialog, Card, StatCard, BarList, Meter, Segmented, FormField, feedback states
│   ├── forms/                  DepartmentForm, ProjectForm, TaskForm, TagForm (React Hook Form + Zod)
│   └── *.tsx                   Badges, ProjectCard, TaskBoard, TaskColumns, TagMultiSelect, DepartmentAvatar
├── lib/
│   ├── api.ts                  Typed API client (Bearer token, refresh on 401, error parsing, health check)
│   ├── auth.ts                 Session storage, JWT decoding, expiry helpers
│   ├── types.ts                DTO types matching the backend contract
│   ├── constants.ts            Status / priority labels and badge colours
│   ├── useFetch.ts             Data-fetching hook (loading / error / reload) + useDebounce
│   ├── useCrudDialogs.ts       Shared create / edit / delete dialog state for management pages
│   ├── forms.ts                Maps server validation errors onto form fields
│   └── utils.ts                Dates, overdue detection, percentages, helpers
├── middleware.ts               Server-side redirect for /admin/* and /profile without a session
└── docs/                       ERD and screenshots used in this README
```

## Running locally

```bash
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at the backend
npm install
npm run dev                    # http://localhost:3000
```

The [backend](../backend) must be running, and it must allow `http://localhost:3000` in its CORS settings. That origin is allowed by default. Log in with the seeded Admin account, or register a Staff account at `/register`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## Environment variables

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tasktrack-api.onrender.com` | Backend base URL, with no trailing slash and without `/api` |

## CI/CD

The pipeline is defined in [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml) at the repository root. It only runs when files under `frontend/` change.

```mermaid
flowchart LR
    A[npm ci] --> B[ESLint] --> C[Type-check] --> D[Next.js build] --> E[Deploy to Vercel]
```

| Trigger | What runs |
|---|---|
| Pull request to `main` | Install, lint, type-check and production build |
| Push to `main` | The same steps, then a production deploy to Vercel |
| Manual (`workflow_dispatch`) | The same as a push |

- **Deployment is gated by CI.** The deploy job runs only after the quality job succeeds.
- **The deploy job is optional.** If the Vercel secrets are missing, the job skips with a notice instead of failing. Vercel's Git integration can deploy the site in that case.
- **Dependabot** opens weekly PRs for npm updates and monthly PRs for GitHub Actions updates.

| Name | Type | Where to find it |
|---|---|---|
| `VERCEL_TOKEN` | Secret | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Secret | `orgId` in `.vercel/project.json`, created by `npx vercel link` |
| `VERCEL_PROJECT_ID` | Secret | `projectId` in `.vercel/project.json` |
| `BACKEND_URL` | Variable (optional) | The Render URL. CI injects it as `NEXT_PUBLIC_API_URL` at build time |

> If you deploy through GitHub Actions, disable Vercel's Git-triggered deployments to avoid building twice.

## Deployment

The app is deployed on **Vercel**:

1. Import this repository and set **Root Directory** to `frontend`. Vercel detects Next.js automatically.
2. Add `NEXT_PUBLIC_API_URL` under Project → Settings → Environment Variables.
3. Deploy, then add the Vercel domain to the backend's `CORS_ORIGINS`.

Deployments can also be run from GitHub Actions once the `VERCEL_*` secrets are set. See [CI/CD](#cicd).

## Assignment bonus features

| Bonus item (Assignment 2) | Where |
|---|---|
| Refresh token | [`lib/api.ts`](lib/api.ts) (refresh on `401`) and [`components/auth/AuthProvider.tsx`](components/auth/AuthProvider.tsx) (refresh before `exp`) |
| User profile page | [`app/profile/page.tsx`](app/profile/page.tsx): update name, change password |
| Audit fields | *Created by* column in `/admin/tasks` and `/admin/projects`; *Created by* / *Last edited by* on the task detail page |
| GitHub Actions CI | [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml): ESLint, type-check, build |

| Bonus item (Assignment 1) | Where |
|---|---|
| Status filter on the task list page | [`app/tasks/page.tsx`](app/tasks/page.tsx) — status tabs with live counts (also on `/admin/tasks`) |
| GitHub Actions CI on every push | [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml) — ESLint, TypeScript type-check, production build; Vercel deploy on `main` |
| ERD diagram image in the README | [`docs/erd.png`](docs/erd.png) (see [Data model](#data-model)) |

## Author

**Phan Văn Lộc** · QE190160 · SE19B
PRN232 · Assignment 2
