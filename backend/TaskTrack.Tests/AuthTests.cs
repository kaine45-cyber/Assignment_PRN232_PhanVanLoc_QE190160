using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TaskTrack.Tests;

public class AuthTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public AuthTests(ApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Register_creates_staff_and_rejects_duplicate_email()
    {
        var email = Http.UniqueEmail("reg");
        var first = await _client.Send(HttpMethod.Post, "/api/auth/register",
            new { fullName = "New User", email, password = "Password1!", role = 1 });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var body = await first.ReadJson();
        Assert.Equal(0, body.GetProperty("role").GetInt32()); // role in the request is ignored → Staff
        Assert.False(body.TryGetProperty("passwordHash", out _));

        var duplicate = await _client.Send(HttpMethod.Post, "/api/auth/register",
            new { fullName = "Again", email = email.ToUpperInvariant(), password = "Password1!" });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public async Task Register_validates_fields()
    {
        var response = await _client.Send(HttpMethod.Post, "/api/auth/register", new { fullName = "", email = "not-an-email", password = "1" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_returns_jwt_with_required_claims()
    {
        var (token, _, accountId) = await _client.Login(ApiFactory.AdminEmail, ApiFactory.AdminPassword);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal(accountId.ToString(), jwt.Claims.First(c => c.Type == "accountId").Value);
        Assert.Equal(ApiFactory.AdminEmail, jwt.Claims.First(c => c.Type == "email").Value);
        Assert.Equal("Admin", jwt.Claims.First(c => c.Type == "role").Value);
        Assert.Contains(jwt.Claims, c => c.Type == "exp");
        Assert.InRange(jwt.ValidTo - DateTime.UtcNow, TimeSpan.FromHours(23.9), TimeSpan.FromHours(24.1));
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401()
    {
        var response = await _client.Send(HttpMethod.Post, "/api/auth/login", new { email = ApiFactory.AdminEmail, password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Expired_token_is_rejected_with_401()
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")!;
        var token = new JwtSecurityToken(
            issuer: "TaskTrack.API", audience: "TaskTrack.Web",
            claims: new[] { new Claim("accountId", "1"), new Claim("role", "Admin"), new Claim("email", ApiFactory.AdminEmail) },
            notBefore: DateTime.UtcNow.AddHours(-3), expires: DateTime.UtcNow.AddHours(-2),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), SecurityAlgorithms.HmacSha256));
        var expired = new JwtSecurityTokenHandler().WriteToken(token);

        var response = await _client.Send(HttpMethod.Get, "/api/accounts", token: expired);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_token_rotates_and_detects_reuse()
    {
        var (_, refresh, _) = await _client.Login(ApiFactory.AdminEmail, ApiFactory.AdminPassword);

        var rotated = await _client.Send(HttpMethod.Post, "/api/auth/refresh", new { refreshToken = refresh });
        Assert.Equal(HttpStatusCode.OK, rotated.StatusCode);

        var reused = await _client.Send(HttpMethod.Post, "/api/auth/refresh", new { refreshToken = refresh });
        Assert.Equal(HttpStatusCode.Unauthorized, reused.StatusCode);
    }

    [Fact]
    public async Task Profile_update_and_password_change()
    {
        var email = Http.UniqueEmail("profile");
        await _client.Send(HttpMethod.Post, "/api/auth/register", new { fullName = "Profile User", email, password = "OldPass@123" });
        var (token, _, _) = await _client.Login(email, "OldPass@123");

        var update = await _client.Send(HttpMethod.Put, "/api/auth/me", new { fullName = "Renamed User" }, token);
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal("Renamed User", (await update.ReadJson()).GetProperty("fullName").GetString());

        var wrong = await _client.Send(HttpMethod.Put, "/api/auth/me/password", new { currentPassword = "nope-nope", newPassword = "NewPass@123" }, token);
        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);

        var change = await _client.Send(HttpMethod.Put, "/api/auth/me/password", new { currentPassword = "OldPass@123", newPassword = "NewPass@123" }, token);
        Assert.Equal(HttpStatusCode.NoContent, change.StatusCode);
        await _client.Login(email, "NewPass@123");
    }
}
