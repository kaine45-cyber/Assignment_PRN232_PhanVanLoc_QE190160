using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TaskTrack.API.Security;
using TaskTrack.Service.Security;

namespace TaskTrack.API.Extensions;

public static class AuthSetup
{
    /// <summary>
    /// Reads JWT settings. The secret comes from the JWT_SECRET environment variable (Render) or
    /// Jwt:Secret (appsettings.Development.json / user-secrets) — it is never hard-coded.
    /// </summary>
    public static JwtSettings ReadJwtSettings(IConfiguration configuration)
    {
        var settings = new JwtSettings();
        configuration.GetSection("Jwt").Bind(settings);

        var envSecret = configuration["JWT_SECRET"];
        if (!string.IsNullOrWhiteSpace(envSecret)) settings.Secret = envSecret;

        if (string.IsNullOrWhiteSpace(settings.Secret) || settings.Secret.Length < 32)
            throw new InvalidOperationException(
                "JWT secret is missing or too short. Set the JWT_SECRET environment variable (at least 32 characters).");

        return settings;
    }

    public static IServiceCollection AddJwtAuth(this IServiceCollection services, JwtSettings settings)
    {
        services.AddSingleton(settings);
        services.AddSingleton<TaskTrack.Service.Interfaces.ITokenService, JwtTokenService>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false; // keep "role", "name", "accountId" as-is
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = settings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = settings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = JwtTokenService.CreateSigningKey(settings.Secret),
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = AppClaims.Name,
                    RoleClaimType = AppClaims.Role,
                };
                options.Events = new JwtBearerEvents
                {
                    // 401 — missing, invalid or expired token (JSON body, same shape as other errors)
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        var expired = context.AuthenticateFailure is SecurityTokenExpiredException;
                        if (expired) context.Response.Headers.Append("X-Token-Expired", "true");
                        await WriteJson(context.Response, StatusCodes.Status401Unauthorized, "Unauthorized",
                            expired ? "Your session has expired. Please log in again."
                                    : "Authentication is required. Send a valid Bearer token in the Authorization header.");
                    },
                    // 403 — authenticated but not in the required role (e.g. Staff calling an Admin endpoint)
                    OnForbidden = context =>
                        WriteJson(context.Response, StatusCodes.Status403Forbidden, "Forbidden",
                            "You do not have permission to perform this action."),
                };
            });

        services.AddAuthorization();
        return services;
    }

    private static Task WriteJson(HttpResponse response, int status, string title, string message)
    {
        response.StatusCode = status;
        response.ContentType = "application/json";
        return response.WriteAsync(JsonSerializer.Serialize(new { status, title, message },
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
}
