# TaskTrack — PRN232 Assignment 1 (Frontend)

Next.js 15 (App Router, TypeScript) + Tailwind CSS. All data comes from the TaskTrack ASP.NET Core API.

- **Live site:** `https://<your-app>.vercel.app`
- **Backend repo / Swagger:** `https://github.com/<you>/StudentID_ClassCode_Ass1_BE` · `https://<service>.onrender.com/swagger`

## Pages

| Route | Description |
|---|---|
| `/` | Welcome banner, summary counts, active projects as cards |
| `/departments` | Active departments (with name search) |
| `/departments/[id]` | Department info + its projects |
| `/projects` | Active projects with name / status / department filters |
| `/projects/[id]` | Project details, progress, task list (status / priority badges, tags, due date) |
| `/tasks` | Task list with status filter (bonus) |
| `/tasks/[id]` | All fields of a task, including tags |
| `/search` | Filter tasks by title, status, priority, project, tag — updates as filters change (synced to the URL) |
| `/departments/manage` | CRUD table, create/edit modal, delete confirmation |
| `/projects/manage` | CRUD table, create/edit modal, delete confirmation |
| `/tasks/manage` | CRUD table, tag multi-select, soft delete with confirmation |
| `/tags/manage` | CRUD table with color picker, delete confirmation |

UI: colored status / priority badges, loading skeletons & spinners, toast notifications (sonner), confirmation dialogs (Radix Dialog),
client-side validation (react-hook-form + zod) plus server field errors shown under the matching input, responsive layout.

## Structure

```
app/          routes (App Router)
components/   Navbar, badges, modal, confirm dialog, tag multi-select, task list, feedback states
lib/          api.ts (typed API client), types.ts, constants.ts (status/priority labels & colors), useFetch.ts, forms.ts, utils.ts
```

## Run locally

```bash
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                     # http://localhost:3000
```

## Deploy to Vercel

1. Import this repo in Vercel (framework preset: Next.js).
2. Environment variable: `NEXT_PUBLIC_API_URL=https://<service>.onrender.com` (no trailing slash, without `/api`).
3. Deploy, then add the Vercel domain to the backend's `CORS_ORIGINS` on Render.

> The free Render instance sleeps when idle; the first request can take up to a minute. The UI shows a loading state meanwhile.
