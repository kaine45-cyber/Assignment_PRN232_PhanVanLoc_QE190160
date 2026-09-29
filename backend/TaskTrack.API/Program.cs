using System.Reflection;
using Microsoft.EntityFrameworkCore;
using TaskTrack.API.Extensions;
using TaskTrack.API.Middleware;
using TaskTrack.Repo.Models;
using TaskTrack.Service;

// "timestamp without time zone" columns: keep Npgsql's pre-6.0 DateTime behaviour so DateTime.Now can be saved.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Render injects PORT — listen on it when present.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// ---------- Database ----------
builder.Services.AddDbContext<TaskManagementContext>(options =>
    options.UseNpgsql(ConnectionStringHelper.Resolve(builder.Configuration)));

// ---------- Repositories + Services ----------
builder.Services.AddTaskTrackServices();

// ---------- Controllers ----------
builder.Services.AddControllers();

// ---------- CORS ----------
// Origins come from Cors:AllowedOrigins (appsettings) and/or CORS_ORIGINS env var (comma separated).
var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
    .Concat((builder.Configuration["CORS_ORIGINS"] ?? string.Empty)
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    .Select(o => o.TrimEnd('/'))
    .Distinct()
    .ToArray();

const string CorsPolicy = "FrontendPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ---------- Swagger ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TaskTrack API", Version = "v1", Description = "PRN232 Assignment 1 — public Task Management API" });
    var xml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

// Swagger is enabled in Development AND on Render (Production) because the assignment requires
// the live Swagger URL to be reachable.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskTrack API v1");
    c.DocumentTitle = "TaskTrack API";
});

app.UseCors(CorsPolicy);

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow })).ExcludeFromDescription();

app.MapControllers();

app.Run();
