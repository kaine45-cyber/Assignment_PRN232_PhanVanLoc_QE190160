namespace TaskTrack.Service.Security;

/// <summary>Token settings. The secret is read from configuration (JWT_SECRET / Jwt:Secret), never hard-coded.</summary>
public class JwtSettings
{
    public string Issuer { get; set; } = "TaskTrack.API";
    public string Audience { get; set; } = "TaskTrack.Web";
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 1440;   // 24 hours
    public int RefreshTokenDays { get; set; } = 7;
}
