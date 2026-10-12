<div align="center">

# TaskTrack API

**PRN232 · Assignment 2: Task & Team Management (Backend)**

RESTful API built with **ASP.NET Core 8**, **Entity Framework Core 8** (Database-First) and **PostgreSQL**, using a clean three-layer architecture, with **JWT authentication** and **role-based authorization** (Staff / Admin).

[![CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/backend.yml)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

</div>

| | |
|---|---|
| **Live API (Swagger)** | [tasktrack-api-ay24.onrender.com/swagger](https://tasktrack-api-ay24.onrender.com/swagger) |
| **Frontend (same repository)** | [`frontend/`](../frontend) |
| **Frontend (live)** | [assignment-prn-232-phan-van-loc-qe.vercel.app](https://assignment-prn-232-phan-van-loc-qe.vercel.app) |

> The API runs on Render's free tier and sleeps when idle, so the first request can take up to about a minute.

## Contents

- [Architecture](#architecture)
- [Data model](#data-model)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Validation & error handling](#validation--error-handling)
- [Running locally](#running-locally)
- [Configuration](#configuration)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Implementation notes](#implementation-notes)
- [Assignment bonus features](#assignment-bonus-features)
- [Known limitations](#known-limitations)
- [Author](#author)

## Architecture

```
QE190160_SE19B_Ass1_BE.sln
├── TaskTrack.API          Presentation layer
│   ├── Controllers/       Departments, Projects, Tasks, Tags, Auth, Accounts
│   ├── Security/          JwtTokenService (HS256 access tokens)
│   ├── Middleware/        ExceptionMiddleware (AppException → JSON response)
│   ├── Extensions/        AuthSetup (JWT bearer + JSON 401/403), ClaimsPrincipal helpers, ConnectionStringHelper
│   └── Program.cs         DI, CORS, authentication, Swagger (Bearer), pipeline
├── TaskTrack.Service      Business layer
│   ├── DTOs/              Request / response models + DataAnnotations validation
│   ├── Services/          Business rules (delete guards, soft delete, tag replacement, auth, accounts)
│   ├── Security/          BCryptPasswordHasher, JwtSettings, RefreshTokenGenerator
│   ├── Mappers/           Entity → DTO mapping
│   └── Common/            NotFound / BadRequest / Unauthorized / Forbidden / Conflict exceptions
└── TaskTrack.Repo         Data access layer
    ├── Models/            Scaffolded entities + TaskManagementContext
    ├── Interfaces/        IGenericRepository<T> + entity-specific contracts
    └── Repositories/      EF Core queries (Include, ILIKE search, existence checks)

TaskTrack.Tests            xUnit integration tests (WebApplicationFactory + PostgreSQL)
```

**Dependency flow:** `API → Service → Repo`. Controllers never reference the `DbContext`, and all database access goes through repositories. Services and repositories are registered in one place, `AddTaskTrackServices()`.

## Data model

![Entity Relationship Diagram](docs/erd.png)

<details>
<summary>Mermaid source (also in <code>docs/erd.mmd</code>)</summary>

```mermaid
erDiagram
    direction LR
    Department ||--o{ Project : "owns"
    Project ||--o{ Task : "contains"
    Task ||--o{ TaskTag : "is tagged"
    Tag ||--o{ TaskTag : "labels"
    SystemAccount |o--o{ Task : "created / updated"
    SystemAccount |o--o{ Project : "created / updated"
    SystemAccount ||--o{ RefreshToken : "owns"

    Department {
        serial DepartmentID PK
        varchar(100) DepartmentName "NOT NULL"
        varchar(300) DepartmentDescription "NOT NULL"
        boolean IsActive "DEFAULT TRUE"
    }
    Project {
        serial ProjectID PK
        varchar(200) ProjectName "NOT NULL"
        text Description
        date StartDate "NOT NULL"
        date EndDate
        smallint Status "0 NotStarted 1 InProgress 2 Completed 3 OnHold"
        int DepartmentID FK
        boolean IsActive "DEFAULT TRUE"
        timestamp CreatedDate "DEFAULT now"
        int CreatedByID FK "nullable, audit"
        int UpdatedByID FK "nullable, audit"
    }
    Task {
        serial TaskID PK
        varchar(300) Title "NOT NULL"
        text Description
        smallint Status "0 ToDo 1 InProgress 2 Done 3 Cancelled"
        smallint Priority "0 Low 1 Medium 2 High 3 Critical"
        date DueDate
        int ProjectID FK
        boolean IsActive "soft delete flag"
        timestamp CreatedDate "DEFAULT now"
        timestamp ModifiedDate
        int CreatedByID FK "nullable, audit"
        int UpdatedByID FK "nullable, audit"
    }
    Tag {
        serial TagID PK
        varchar(50) TagName UK
        varchar(7) Color "hex e.g. #3B82F6"
    }
    TaskTag {
        int TaskID PK,FK
        int TagID PK,FK
    }
    SystemAccount {
        serial AccountID PK
        varchar(100) FullName "NOT NULL"
        varchar(150) Email UK "stored lower-case"
        varchar(200) PasswordHash "BCrypt"
        smallint Role "0 Staff 1 Admin"
        timestamp CreatedDate "DEFAULT now"
    }
    RefreshToken {
        serial RefreshTokenID PK
        int AccountID FK
        varchar(128) TokenHash UK "SHA-256"
        timestamp ExpiresAt
        timestamp CreatedAt
        timestamp RevokedAt "null while active"
        varchar(128) ReplacedByHash "rotation chain"
    }
```

</details>

| Enum | Values |
|---|---|
| Project `Status` | `0` Not Started · `1` In Progress · `2` Completed · `3` On Hold |
| Task `Status` | `0` To Do · `1` In Progress · `2` Done · `3` Cancelled |
| Task `Priority` | `0` Low · `1` Medium · `2` High · `3` Critical |
| SystemAccount `Role` | `0` Staff · `1` Admin |

The original schema and seed data are in [`database/TaskManagementDB_Postgres.sql`](database/TaskManagementDB_Postgres.sql), used exactly as provided. Assignment 2 changes are applied on top by [`database/migrations/002_auth.sql`](database/migrations/002_auth.sql) (idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`):

- `SystemAccount` (`Email` unique, `Role` check 0/1) and the seeded Admin account `admin@tasktrack.dev`.
- `RefreshToken` (bonus): one row per issued refresh token, deleted with its account.
- `CreatedByID` / `UpdatedByID` on `Task` and `Project` (bonus audit fields). `Task.CreatedByID` uses `NO ACTION`, which is why an account that created tasks cannot be deleted; the other audit keys use `ON DELETE SET NULL`.

After the migration, `SystemAccount`, `RefreshToken` and the audit navigations were added to the model in the same form the scaffold command generates (re-running `dotnet ef dbcontext scaffold` against the migrated database produces the same entities).

## Authentication

| | |
|---|---|
| Password hashing | BCrypt (`BCrypt.Net-Next`, work factor 11) |
| Access token | JWT, HS256, 24 hours. Claims: `sub`, `accountId`, `email`, `name`, `role`, `jti`, `exp`. Issuer `TaskTrack.API`, audience `TaskTrack.Web` |
| Secret | `JWT_SECRET` environment variable (or `Jwt:Secret` from user-secrets). Minimum 32 characters, the API fails fast otherwise |
| Refresh token | 64 random bytes, 7 days, stored as a SHA-256 hash, rotated on every refresh; reuse of a revoked token revokes all of the account's tokens |
| Roles | `[Authorize]` on every `POST` / `PUT` / `DELETE`; `[Authorize(Roles = "Admin")]` on `AccountsController` |
| Errors | Missing / invalid / expired token → `401 {status, title, message}` (expired tokens also send `X-Token-Expired: true`); wrong role → `403` |

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@tasktrack.dev", "password": "Admin@QE190160" }
```

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiIs…",
  "expiresAt": "2026-10-13T08:00:00Z",
  "refreshToken": "q0Xn…",
  "refreshTokenExpiresAt": "2026-10-19T08:00:00Z",
  "user": { "accountId": 1, "fullName": "System Administrator", "email": "admin@tasktrack.dev", "role": 1, "roleName": "Admin" }
}
```

Send the token as `Authorization: Bearer <accessToken>`. In Swagger, click **Authorize** and paste the token.

## API reference

Base URL: `/api`. 🔓 = public, 🔑 = any logged-in account (Staff or Admin), 👑 = Admin only. Interactive documentation is available at **`/swagger`**.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | 🔓 | Create a **Staff** account. `201`, or **`409`** if the email is already registered |
| `POST` | `/auth/login` | 🔓 | `200` with tokens and user, or **`401`** for a wrong email or password |
| `POST` | `/auth/refresh` | 🔓 | Exchange a refresh token for a new token pair, or `401` |
| `POST` | `/auth/logout` | 🔓 | Revoke a refresh token (`204`, idempotent) |
| `GET` | `/auth/me` | 🔑 | The current account |
| `PUT` | `/auth/me` | 🔑 | Update the current account's full name |
| `PUT` | `/auth/me/password` | 🔑 | Change password (requires the current password); signs out every session |

### Accounts

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/accounts` | 👑 | List accounts with the number of tasks each created |
| `GET` | `/accounts/{id}` | 👑 | Get one account |
| `PUT` | `/accounts/{id}` | 👑 | Update full name and role. You cannot demote yourself or the last Admin (`400`) |
| `DELETE` | `/accounts/{id}` | 👑 | Delete an account. **`409`** if it created tasks; `400` for your own account or the last Admin |

In the four tables below, every `GET` is 🔓 and every `POST` / `PUT` / `DELETE` is 🔑.

### Departments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/departments` | List active departments. `?includeInactive=true` also returns inactive ones (used by the admin page) |
| `GET` | `/departments/{id}` | Get a department with its projects |
| `GET` | `/departments/search?name=` | Search by name (partial, case-insensitive) |
| `POST` | `/departments` | Create a department |
| `PUT` | `/departments/{id}` | Update a department |
| `DELETE` | `/departments/{id}` | Delete a department. Returns **`400`** if any project is linked |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/projects` | List active projects, including the department name |
| `GET` | `/projects/{id}` | Get a project with its tasks and their tags |
| `GET` | `/projects/department/{departmentId}` | List projects in a department |
| `GET` | `/projects/search?name=&status=&departmentId=` | Filter projects. All parameters are optional |
| `POST` | `/projects` | Create a project |
| `PUT` | `/projects/{id}` | Update a project |
| `DELETE` | `/projects/{id}` | Delete a project. Returns **`400`** if any task is linked |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List active tasks |
| `GET` | `/tasks/{id}` | Get a task including its tags |
| `GET` | `/tasks/project/{projectId}` | List tasks in a project |
| `GET` | `/tasks/search?title=&status=&priority=&projectId=&tagId=` | Filter tasks. All parameters are optional |
| `POST` | `/tasks` | Create a task. Accepts an optional `tagIds` array |
| `PUT` | `/tasks/{id}` | Update a task. **Replaces its tags** and sets `ModifiedDate` to now |
| `DELETE` | `/tasks/{id}` | **Soft delete**: sets `IsActive = false`. Tasks are never hard-deleted |

### Tags

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tags` | List all tags, with usage count |
| `POST` | `/tags` | Create a tag. The name must be unique and the color must be a hex code such as `#3B82F6` |
| `PUT` | `/tags/{id}` | Update a tag |
| `DELETE` | `/tags/{id}` | Delete a tag. Returns **`400`** if any task uses it |

### Example: create a task

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "title": "Write API contract tests",
  "description": "Cover /api/tasks request/response shapes",
  "status": 0,
  "priority": 2,
  "dueDate": "2024-06-30",
  "projectId": 4,
  "tagIds": [2, 7]
}
```

The response is `201 Created`. It returns the created task with its project name, the resolved tags and `createdById` / `createdByName` taken from the token.

## Validation & error handling

| Status | When | Body |
|---|---|---|
| `400` | A model validation rule fails (required field, length, range, hex color) | `{ title, status, errors: { "Field": ["message"] } }` |
| `400` | A business rule is violated (linked records, duplicate tag, unknown FK) | `{ status, title, message, errors? }` |
| `401` | No token, an invalid token or an expired token on a protected endpoint; wrong login | `{ status, title, message }` |
| `403` | A Staff token on an Admin-only endpoint | `{ status, title, message }` |
| `404` | The resource does not exist, or the task is soft-deleted | `{ status, title, message }` |
| `409` | Email already registered; deleting an account that created tasks | `{ status, title, message, errors? }` |
| `500` | An unexpected error occurs. It is logged, and details are never returned | `{ status, title, message }` |

Example response when you try to delete a department that still has projects:

```json
{
  "status": 400,
  "title": "Bad Request",
  "message": "Cannot delete this department because it still has projects linked to it."
}
```

## Running locally

```bash
# 1. Create the database and apply the Assignment 2 migration
psql -d TaskManagementDB -f database/TaskManagementDB_Postgres.sql
psql -d TaskManagementDB -f database/migrations/002_auth.sql

# 2. Set ConnectionStrings:DefaultConnection in TaskTrack.API/appsettings.json
#    and keep the JWT secret out of the repository:
dotnet user-secrets set "Jwt:Secret" "<at least 32 random characters>" --project TaskTrack.API

# 3. Run the API
dotnet run --project TaskTrack.API

# 4. Run the integration tests (uses the same database; JWT_SECRET falls back to a test value)
dotnet test
```

Open **http://localhost:5000/swagger**.

## Configuration

| Key / variable | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | Local PostgreSQL connection string (`appsettings.json`) |
| `DATABASE_URL` | Takes precedence over the setting above. Accepts either a `postgres://` URI or a key/value connection string |
| `JWT_SECRET` | **Required.** JWT signing key, at least 32 characters. Overrides `Jwt:Secret` |
| `Jwt:AccessTokenMinutes` / `Jwt:RefreshTokenDays` | Token lifetimes (defaults 1440 minutes and 7 days) |
| `RUN_MIGRATIONS` | `false` disables the startup migration runner (default: on) |
| `CORS_ORIGINS` | Comma-separated list of allowed origins. It is merged with `Cors:AllowedOrigins` from `appsettings.json` |
| `ASPNETCORE_ENVIRONMENT` | `Development` or `Production` |
| `PORT` | The listening port. Render sets it automatically |

## Docker

```bash
docker build -t tasktrack-api .
docker run -p 8080:8080 -e DATABASE_URL="postgres://user:pass@host:5432/db" -e JWT_SECRET="<64 random characters>" tasktrack-api
```

The Dockerfile uses a multi-stage build: the .NET 8 SDK image builds the app, and the ASP.NET runtime image runs it. The CI/CD pipeline publishes the image to `ghcr.io/<owner>/tasktrack-api` on every push to `main`.

## CI/CD

The pipeline is defined in [`.github/workflows/backend.yml`](../.github/workflows/backend.yml) at the repository root. It only runs when files under `backend/` change.

```mermaid
flowchart LR
    A[Restore + build] --> T[Integration tests<br/>postgres:16 service] --> D[Docker build<br/>push to GHCR on main] --> E[Deploy to Render]
```

| Trigger | What runs |
|---|---|
| Pull request to `main` | Restore, build, publish, integration tests and Docker build. The image is not pushed |
| Push to `main` | The same steps, then the image is pushed as `ghcr.io/<owner>/tasktrack-api:latest` and `:<sha>`, then a Render deploy is triggered |
| Manual (`workflow_dispatch`) | The same as a push |

- **The test job** starts PostgreSQL 16, runs `database/TaskManagementDB_Postgres.sql` and `database/migrations/*.sql`, then `dotnet test` with the GitHub Actions logger.
- **Deployment is gated by CI.** The deploy job runs only after the build, test and Docker jobs succeed.
- **The deploy job is optional.** If `RENDER_DEPLOY_HOOK_URL` is not set, the job skips with a notice instead of failing. Render's own Auto-Deploy can be used in that case.
- **Dependabot** opens weekly PRs for NuGet package updates and monthly PRs for GitHub Actions updates.

| Secret (Settings → Secrets and variables → Actions) | Where to find it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → Web Service → Settings → *Deploy Hook* |

> If you use the deploy hook, set Render's *Auto-Deploy* to **Off** to avoid deploying twice.

## Deployment

**Database: Render PostgreSQL**
1. Create the database: **New → PostgreSQL** (Free).
2. Connect with the *External Database URL* and run `database/TaskManagementDB_Postgres.sql`. `database/migrations/*.sql` is applied by the API itself on startup (`DatabaseMigrator`).

**API: Render Web Service**
1. Create the service: **New → Web Service**, select this repository, set **Root Directory** to `backend` and **Runtime** to **Docker**.
2. Set the environment variables:
   - `DATABASE_URL`: the *Internal Database URL*
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
   - `JWT_SECRET`: 64 random characters
3. Open `https://<service>.onrender.com/swagger` to check that the API is running.

## Implementation notes

- **Database-First.** The entities were generated with the command below.

  ```bash
  dotnet ef dbcontext scaffold "<connection>" Npgsql.EntityFrameworkCore.PostgreSQL \
    -o Models --context TaskManagementContext --no-onconfiguring
  ```

  The schema was not modified. Two adjustments were made to the generated code after scaffolding:
  1. The entity `Task` was renamed to `TaskItem` so that it does not clash with `System.Threading.Tasks.Task`. It is still mapped to the `"Task"` table.
  2. `HasDefaultValue` was removed from `IsActive`, `Priority` and `Status`. EF Core skips a property whose value equals the CLR default, so with those defaults in place `false` or `0` would have been replaced by the database default. The service layer always sets these values explicitly instead.
- **Timestamps.** The `timestamp without time zone` columns use Npgsql's legacy timestamp behaviour, so `DateTime.Now` is stored as-is.
- **Delete guards count every linked row**, including soft-deleted tasks, because the foreign keys would block the delete anyway.
- **Swagger in production.** Swagger is intentionally enabled in Production so that the live API documentation stays reachable. It declares the Bearer scheme, so protected endpoints can be tried after clicking **Authorize**.
- **Startup migrations.** `DatabaseMigrator` runs every file in `database/migrations/` (copied into the build output) inside a transaction when the API starts. The scripts are idempotent, so this is safe on every restart and upgrades the Render database without an external connection.
- **Emails are normalised** (trimmed, lower-case) before they are stored or compared.
- **Login failures are indistinguishable.** A wrong email and a wrong password return the same `401` message, so the API does not reveal which emails exist.
- **Inbound claim mapping is disabled** (`MapInboundClaims = false`), so the token's `role` and `sub` claims are read as-is.

## Assignment bonus features

| Bonus item (Assignment 2) | Where |
|---|---|
| Refresh token | `POST /api/auth/refresh`, `RefreshToken` table, rotation and reuse detection in `AuthService` |
| User profile | `GET` / `PUT /api/auth/me`, `PUT /api/auth/me/password` (used by the frontend `/profile` page) |
| Audit fields | `CreatedByID` / `UpdatedByID` on `Task` and `Project`, set from the JWT in `TasksController` / `ProjectsController` |
| GitHub Actions CI | Build + integration tests on PostgreSQL + Docker ([`backend.yml`](../.github/workflows/backend.yml)) |

| Bonus item (Assignment 1) | Where |
|---|---|
| Status filter on the task list page | Frontend `/tasks` (status tabs with counts) and `/admin/tasks` |
| GitHub Actions CI on every push | [`.github/workflows/backend.yml`](../.github/workflows/backend.yml) — restore, build, publish, Docker build; plus GHCR push & Render deploy on `main` (the frontend pipeline runs lint, type-check, build & Vercel deploy) |
| ERD diagram image in the README | [`docs/erd.png`](docs/erd.png) (see [Data model](#data-model)) |

## Known limitations

- **Render cold starts.** The free Render instance sleeps after inactivity, so the first request may take 30–60 seconds.
- **Projects with tasks cannot be deleted.** Tasks are only ever soft-deleted, so their rows stay in the database. The foreign key keeps blocking deletion of the parent project even after all of its tasks are soft-deleted. This is the expected result of the assignment's rules.
- **Free database lifetime.** Render's free PostgreSQL instances have a limited lifetime.
- **Stateless access tokens.** Logout revokes the refresh token, but an access token stays valid until it expires (24 hours). Changing the password revokes every refresh token.

## Author

**Phan Văn Lộc** · QE190160 · SE19B
PRN232 · Assignment 2
