using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TaskTrack.Tests;

/// <summary>
/// Boots the real API (Program.cs) against a real PostgreSQL database that already contains
/// TaskManagementDB_Postgres.sql + migrations/002_auth.sql (the CI workflow prepares it).
/// Connection string: ConnectionStrings__DefaultConnection or DATABASE_URL environment variable.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string TestSecret = "integration-tests-only-secret-0123456789-abcdefghijklmnop";
    public const string AdminEmail = "admin@tasktrack.dev";
    public static string AdminPassword => Environment.GetEnvironmentVariable("TEST_ADMIN_PASSWORD") ?? "Admin@QE190160";

    static ApiFactory()
    {
        // Program.cs reads these while building the host, so they must be real environment variables.
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("JWT_SECRET")))
            Environment.SetEnvironmentVariable("JWT_SECRET", TestSecret);
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"))
            && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")))
            Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection",
                "Host=localhost;Port=5432;Database=tasktrack_test;Username=postgres;Password=postgres");
    }
}

public static class Http
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static async Task<JsonElement> ReadJson(this HttpResponseMessage response)
    {
        var text = await response.Content.ReadAsStringAsync();
        return string.IsNullOrWhiteSpace(text) ? default : JsonDocument.Parse(text).RootElement.Clone();
    }

    public static HttpRequestMessage Request(HttpMethod method, string url, object? body = null, string? token = null)
    {
        var request = new HttpRequestMessage(method, url);
        if (body != null) request.Content = JsonContent.Create(body, options: Json);
        if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    public static Task<HttpResponseMessage> Send(this HttpClient client, HttpMethod method, string url, object? body = null, string? token = null)
        => client.SendAsync(Request(method, url, body, token));

    public static string UniqueEmail(string prefix) => $"{prefix}.{Guid.NewGuid():N}@tests.dev";

    public static async Task<(string Token, string Refresh, int AccountId)> Login(this HttpClient client, string email, string password)
    {
        var response = await client.Send(HttpMethod.Post, "/api/auth/login", new { email, password });
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var json = await response.ReadJson();
        return (json.GetProperty("accessToken").GetString()!, json.GetProperty("refreshToken").GetString()!,
            json.GetProperty("user").GetProperty("accountId").GetInt32());
    }

    public static async Task<(string Token, int AccountId)> NewStaff(this HttpClient client, string password = "Staff@12345")
    {
        var email = UniqueEmail("staff");
        var reg = await client.Send(HttpMethod.Post, "/api/auth/register", new { fullName = "Test Staff", email, password });
        Assert.Equal(System.Net.HttpStatusCode.Created, reg.StatusCode);
        var (token, _, id) = await client.Login(email, password);
        return (token, id);
    }
}
