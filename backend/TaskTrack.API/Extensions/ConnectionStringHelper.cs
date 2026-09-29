namespace TaskTrack.API.Extensions;

public static class ConnectionStringHelper
{
    /// <summary>
    /// Resolves the PostgreSQL connection string.
    /// Priority: DATABASE_URL env var (Render) → ConnectionStrings:DefaultConnection (appsettings.json).
    /// Render gives a URI (postgres://user:pass@host:port/db) that Npgsql cannot read, so it is converted
    /// to the key=value format.
    /// </summary>
    public static string Resolve(IConfiguration configuration)
    {
        var databaseUrl = configuration["DATABASE_URL"];
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            return databaseUrl.StartsWith("postgres", StringComparison.OrdinalIgnoreCase)
                ? FromUri(databaseUrl)
                : databaseUrl;
        }

        return configuration.GetConnectionString("DefaultConnection")
               ?? throw new InvalidOperationException(
                   "No connection string configured. Set DATABASE_URL or ConnectionStrings:DefaultConnection.");
    }

    public static string FromUri(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={uri.Host};Port={port};Database={database};Username={user};Password={password};" +
               "SSL Mode=Prefer;Trust Server Certificate=true;";
    }
}
