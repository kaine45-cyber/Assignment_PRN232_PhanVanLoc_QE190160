<div align="center">

# TaskTrack API

**PRN232 · Assignment 1: Task & Team Management (Backend)**

RESTful API built with **ASP.NET Core 8**, **Entity Framework Core 8** (Database-First) and **PostgreSQL**, using a clean three-layer architecture.

[![CI/CD](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160/actions/workflows/ci-cd.yml)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

</div>

| | |
|---|---|
| **Live API (Swagger)** | `https://<your-service>.onrender.com/swagger` |
| **Frontend repository** | [Assignment_PRN232_PhanVanLoc_QE190160_FE](https://github.com/kaine45-cyber/Assignment_PRN232_PhanVanLoc_QE190160_FE) |
| **Frontend (live)** | `https://<your-app>.vercel.app` |

> The API runs on Render's free tier and sleeps when idle, so the first request can take up to about a minute.

## Contents

- [Architecture](#architecture)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Validation & error handling](#validation--error-handling)
- [Running locally](#running-locally)
- [Configuration](#configuration)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Implementation notes](#implementation-notes)
- [Known limitations](#known-limitations)
- [Author](#author)

## Architecture

```
QE190160_SE19B_Ass1_BE.sln
├── TaskTrack.API          Presentation layer
│   ├── Controllers/       Departments, Projects, Tasks, Tags
│   ├── Middleware/        ExceptionMiddleware (AppException → JSON response)
│   ├── Extensions/        ConnectionStringHelper (DATABASE_URL → Npgsql)
│   └── Program.cs         DI, CORS, Swagger, pipeline
├── TaskTrack.Service      Business layer
│   ├── DTOs/              Request / response models + DataAnnotations validation
│   ├── Services/          Business rules (delete guards, soft delete, tag replacement)
│   ├── Mappers/           Entity → DTO mapping
│   └── Common/            NotFoundException, BadRequestException
└── TaskTrack.Repo         Data access layer
    ├── Models/            Scaffolded entities + TaskManagementContext
    ├── Interfaces/        IGenericRepository<T> + entity-specific contracts
    └── Repositories/      EF Core queries (Include, ILIKE search, existence checks)
```

**Dependency flow:** `API → Service → Repo`. Controllers never reference the `DbContext`, and all database access goes through repositories. Services and repositories are registered in one place, `AddTaskTrackServices()`.

## Data model

```mermaid
erDiagram
    Department ||--o{ Project : owns
    Project ||--o{ Task : contains
    Task ||--o{ TaskTag : tagged
    Tag ||--o{ TaskTag : labels

    Department {
        int DepartmentID PK
        varchar(100) DepartmentName
        varchar(300) DepartmentDescription
        bool IsActive
    }
    Project {
        int ProjectID PK
        varchar(200) ProjectName
        text Description
        date StartDate
        date EndDate
        smallint Status
        int DepartmentID FK
        bool IsActive
        timestamp CreatedDate
    }
    Task {
        int TaskID PK
        varchar(300) Title
        text Description
        smallint Status
        smallint Priority
        date DueDate
        int ProjectID FK
        bool IsActive
        timestamp CreatedDate
        timestamp ModifiedDate
    }
    Tag {
        int TagID PK
        varchar(50) TagName UK
        varchar(7) Color
    }
    TaskTag {
        int TaskID PK,FK
        int TagID PK,FK
    }
```

| Enum | Values |
|---|---|
| Project `Status` | `0` Not Started · `1` In Progress · `2` Completed · `3` On Hold |
| Task `Status` | `0` To Do · `1` In Progress · `2` Done · `3` Cancelled |
| Task `Priority` | `0` Low · `1` Medium · `2` High · `3` Critical |

The schema and seed data are in [`database/TaskManagementDB_Postgres.sql`](database/TaskManagementDB_Postgres.sql). The schema is used exactly as provided.

## API reference

Base URL: `/api`. Every endpoint is public. Interactive documentation is available at **`/swagger`**.

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

The response is `201 Created`. It returns the created task with its project name and the resolved tags.

## Validation & error handling

| Status | When | Body |
|---|---|---|
| `400` | A model validation rule fails (required field, length, range, hex color) | `{ title, status, errors: { "Field": ["message"] } }` |
| `400` | A business rule is violated (linked records, duplicate tag, unknown FK) | `{ status, title, message, errors? }` |
| `404` | The resource does not exist, or the task is soft-deleted | `{ status, title, message }` |
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
# 1. Create the database
psql -d TaskManagementDB -f database/TaskManagementDB_Postgres.sql

# 2. Set ConnectionStrings:DefaultConnection in TaskTrack.API/appsettings.json

# 3. Run the API
dotnet restore
dotnet run --project TaskTrack.API
```

Open **http://localhost:5000/swagger**.

## Configuration

| Key / variable | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | Local PostgreSQL connection string (`appsettings.json`) |
| `DATABASE_URL` | Takes precedence over the setting above. Accepts either a `postgres://` URI or a key/value connection string |
| `CORS_ORIGINS` | Comma-separated list of allowed origins. It is merged with `Cors:AllowedOrigins` from `appsettings.json` |
| `ASPNETCORE_ENVIRONMENT` | `Development` or `Production` |
| `PORT` | The listening port. Render sets it automatically |

## Docker

```bash
docker build -t tasktrack-api .
docker run -p 8080:8080 -e DATABASE_URL="postgres://user:pass@host:5432/db" tasktrack-api
```

The Dockerfile uses a multi-stage build: the .NET 8 SDK image builds the app, and the ASP.NET runtime image runs it. The CI/CD pipeline publishes the image to `ghcr.io/<owner>/tasktrack-api` on every push to `main`.

## CI/CD

The pipeline is defined in `.github/workflows/ci-cd.yml` and runs on GitHub Actions.

```mermaid
flowchart LR
    A[Restore] --> B[Build Release] --> C[Publish artifact] --> D[Docker build<br/>push to GHCR on main] --> E[Deploy to Render]
```

| Trigger | What runs |
|---|---|
| Pull request to `main` | Restore, build, publish and Docker build. The image is not pushed |
| Push to `main` | The same steps, then the image is pushed as `ghcr.io/<owner>/tasktrack-api:latest` and `:<sha>`, then a Render deploy is triggered |
| Manual (`workflow_dispatch`) | The same as a push |

- **Deployment is gated by CI.** The deploy job runs only after the build and Docker jobs succeed.
- **The deploy job is optional.** If `RENDER_DEPLOY_HOOK_URL` is not set, the job skips with a notice instead of failing. Render's own Auto-Deploy can be used in that case.
- **Dependabot** opens weekly PRs for NuGet package updates and monthly PRs for GitHub Actions updates.

| Secret (Settings → Secrets and variables → Actions) | Where to find it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render → Web Service → Settings → *Deploy Hook* |

> If you use the deploy hook, set Render's *Auto-Deploy* to **Off** to avoid deploying twice.

## Deployment

**Database: Render PostgreSQL**
1. Create the database: **New → PostgreSQL** (Free).
2. Connect with the *External Database URL* and run `database/TaskManagementDB_Postgres.sql`.

**API: Render Web Service**
1. Create the service: **New → Web Service**, select this repository, and set **Runtime** to **Docker**.
2. Set the environment variables:
   - `DATABASE_URL`: the *Internal Database URL*
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `CORS_ORIGINS=https://<your-app>.vercel.app`
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
- **Swagger in production.** Swagger is intentionally enabled in Production so that the live API documentation stays reachable.

## Known limitations

- **Render cold starts.** The free Render instance sleeps after inactivity, so the first request may take 30–60 seconds.
- **Projects with tasks cannot be deleted.** Tasks are only ever soft-deleted, so their rows stay in the database. The foreign key keeps blocking deletion of the parent project even after all of its tasks are soft-deleted. This is the expected result of the assignment's rules.
- **Free database lifetime.** Render's free PostgreSQL instances have a limited lifetime.
- **No authentication.** All endpoints are public by design. Authentication is planned for Assignment 2.

## Author

**Phan Văn Lộc** · QE190160 · SE19B
PRN232 · Assignment 1
