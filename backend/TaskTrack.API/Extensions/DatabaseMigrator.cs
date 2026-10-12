using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;

namespace TaskTrack.API.Extensions;

/// <summary>
/// Applies the SQL files in <c>database/migrations</c> (copied next to the app at build time) when the API starts.
/// The scripts are idempotent (CREATE ... IF NOT EXISTS, ON CONFLICT DO NOTHING), so running them on every start is safe.
/// This lets Render apply the Assignment 2 schema changes from inside its own network.
/// Turn it off with RUN_MIGRATIONS=false.
/// </summary>
public static class DatabaseMigrator
{
    public static void ApplySqlMigrations(this WebApplication app)
    {
        var enabled = app.Configuration["RUN_MIGRATIONS"];
        if (string.Equals(enabled, "false", StringComparison.OrdinalIgnoreCase)) return;

        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseMigrator");
        var folder = Path.Combine(AppContext.BaseDirectory, "database", "migrations");
        if (!Directory.Exists(folder))
        {
            logger.LogInformation("No migrations folder at {Folder}; skipping.", folder);
            return;
        }

        var files = Directory.GetFiles(folder, "*.sql").OrderBy(f => f, StringComparer.Ordinal).ToList();
        if (files.Count == 0) return;

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TaskManagementContext>();
        var connection = db.Database.GetDbConnection();
        try
        {
            connection.Open();
            foreach (var file in files)
            {
                using var tx = connection.BeginTransaction();
                using var cmd = connection.CreateCommand();
                cmd.Transaction = tx;
                cmd.CommandText = File.ReadAllText(file);
                cmd.CommandTimeout = 120;
                cmd.ExecuteNonQuery();
                tx.Commit();
                logger.LogInformation("Applied migration {File}.", Path.GetFileName(file));
            }
        }
        catch (Exception ex)
        {
            // Do not stop the API: public GET endpoints still work, and the error is visible in the logs.
            logger.LogError(ex, "Applying SQL migrations failed.");
        }
        finally
        {
            connection.Close();
        }
    }
}
