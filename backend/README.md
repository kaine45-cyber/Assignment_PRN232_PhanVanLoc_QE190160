# TaskTrack API — PRN232 Assignment 1 (Backend)

ASP.NET Core Web API (.NET 8) + EF Core (Database-First) + PostgreSQL.
Public CRUD API for Departments, Projects, Tasks and Tags.

- **Live Swagger:** `https://<your-service>.onrender.com/swagger`
- **Frontend repo:** `https://github.com/<you>/StudentID_ClassCode_Ass1_FE`

## Solution structure

```
StudentID_ClassCode_Ass1_BE.sln
├── TaskTrack.API        Controllers, Program.cs, appsettings.json, middleware
├── TaskTrack.Service    DTOs + validation, service interfaces & implementations (business rules)
└── TaskTrack.Repo       EF Core entities, DbContext (scaffolded), repositories
```

Dependency direction: `API → Service → Repo`. Controllers never touch the `DbContext`; all data access goes through repositories.

## Database (ERD)

```mermaid
erDiagram
    Department ||--o{ Project : has
    Project ||--o{ Task : has
    Task }o--o{ Tag : "tagged via TaskTag"

    Department {
        int DepartmentID PK
        varchar DepartmentName
        varchar DepartmentDescription
        bool IsActive
    }
    Project {
        int ProjectID PK
        varchar ProjectName
        text Description
        date StartDate
        date EndDate
        smallint Status "0 Not Started, 1 In Progress, 2 Completed, 3 On Hold"
        int DepartmentID FK
        bool IsActive
        timestamp CreatedDate
    }
    Task {
        int TaskID PK
        varchar Title
        text Description
        smallint Status "0 To Do, 1 In Progress, 2 Done, 3 Cancelled"
        smallint Priority "0 Low, 1 Medium, 2 High, 3 Critical"
        date DueDate
        int ProjectID FK
        bool IsActive
        timestamp CreatedDate
        timestamp ModifiedDate
    }
    Tag {
        int TagID PK
        varchar TagName UK
        varchar Color
    }
    TaskTag {
        int TaskID PK, FK
        int TagID PK, FK
    }
```

Entities were generated with:

```bash
cd TaskTrack.Repo
dotnet ef dbcontext scaffold "Host=...;Database=...;Username=...;Password=..." \
  Npgsql.EntityFrameworkCore.PostgreSQL -o Models --context TaskManagementContext --no-onconfiguring
```

Post-scaffold edits (schema unchanged):
1. Class `Task` renamed to `TaskItem` (still mapped with `ToTable("Task")`) to avoid clashing with `System.Threading.Tasks.Task`.
2. `HasDefaultValue(...)` removed from `IsActive` / `Priority` / `Status` — otherwise EF would skip `false` / `0` on insert and the DB default would win.

## API endpoints

| Method | Route | Notes |
|---|---|---|
| GET | `/api/departments` | Active departments (`?includeInactive=true` for the admin page) |
| GET | `/api/departments/{id}` | Department + its projects |
| GET | `/api/departments/search?name=` | Partial, case-insensitive |
| POST / PUT | `/api/departments`, `/api/departments/{id}` | |
| DELETE | `/api/departments/{id}` | **400** if any project is linked |
| GET | `/api/projects` | Active projects with department name |
| GET | `/api/projects/{id}` | Project + its tasks (with tags) |
| GET | `/api/projects/department/{departmentId}` | |
| GET | `/api/projects/search?name=&status=&departmentId=` | All params optional |
| POST / PUT | `/api/projects`, `/api/projects/{id}` | |
| DELETE | `/api/projects/{id}` | **400** if any task is linked |
| GET | `/api/tasks` | Active tasks |
| GET | `/api/tasks/{id}` | Task + tags |
| GET | `/api/tasks/project/{projectId}` | |
| GET | `/api/tasks/search?title=&status=&priority=&projectId=&tagId=` | All params optional |
| POST | `/api/tasks` | Optional `tagIds: number[]` |
| PUT | `/api/tasks/{id}` | Replaces tags, sets `ModifiedDate = now` |
| DELETE | `/api/tasks/{id}` | **Soft delete** (`IsActive = false`) |
| GET / POST | `/api/tags` | Tag name is unique |
| PUT | `/api/tags/{id}` | |
| DELETE | `/api/tags/{id}` | **400** if used by any task |

Validation errors return **400** with field-level errors:

```json
{ "title": "One or more validation errors occurred.", "status": 400,
  "errors": { "DepartmentName": ["Department name is required."] } }
```

Business-rule errors return `{ "status": 400, "message": "...", "errors": { "Field": ["..."] } }`.

## Run locally

```bash
# 1. Create a PostgreSQL database and run TaskManagementDB_Postgres.sql
# 2. Set the connection string in TaskTrack.API/appsettings.json (or env DATABASE_URL)
dotnet run --project TaskTrack.API   # http://localhost:5000/swagger
```

## Configuration

| Variable | Purpose |
|---|---|
| `ConnectionStrings:DefaultConnection` | Connection string in `appsettings.json` (local) |
| `DATABASE_URL` | Overrides the above. Render's `postgres://user:pass@host/db` URI is converted automatically |
| `CORS_ORIGINS` | Comma-separated allowed origins, e.g. `https://my-fe.vercel.app` (`Cors:AllowedOrigins` in appsettings also works) |
| `ASPNETCORE_ENVIRONMENT` | `Production` on Render |
| `PORT` | Set by Render; the app listens on it |

See `.env.example`.

## Deploy to Render

1. **PostgreSQL:** New → PostgreSQL (Free). Connect with the *External Database URL* (psql / DBeaver / pgAdmin) and run `TaskManagementDB_Postgres.sql`.
2. **Web Service:** New → Web Service → this repo → Runtime **Docker** (uses the `Dockerfile` in the repo root).
3. **Environment:** `DATABASE_URL` = *Internal Database URL*, `ASPNETCORE_ENVIRONMENT=Production`, `CORS_ORIGINS=https://<your-fe>.vercel.app`.
4. Open `https://<service>.onrender.com/swagger`.

> Swagger is enabled in Production on purpose (the assignment requires the live Swagger URL).
