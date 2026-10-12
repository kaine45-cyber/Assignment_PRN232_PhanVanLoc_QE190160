using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Constants;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Security;

namespace TaskTrack.API.Security;

/// <summary>Issues HS256-signed JWT access tokens.</summary>
public class JwtTokenService : ITokenService
{
    private readonly JwtSettings _settings;
    private readonly SigningCredentials _credentials;

    public JwtTokenService(JwtSettings settings)
    {
        _settings = settings;
        _credentials = new SigningCredentials(CreateSigningKey(settings.Secret), SecurityAlgorithms.HmacSha256);
    }

    public static SymmetricSecurityKey CreateSigningKey(string secret) => new(Encoding.UTF8.GetBytes(secret));

    public AccessToken CreateAccessToken(SystemAccount account)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_settings.AccessTokenMinutes);

        // Payload: AccountID, Email and Role (required), plus name / jti. exp & iat are added by JwtSecurityToken.
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.AccountId.ToString()),
            new(AppClaims.AccountId, account.AccountId.ToString()),
            new(JwtRegisteredClaimNames.Email, account.Email),
            new(AppClaims.Name, account.FullName),
            new(AppClaims.Role, Roles.Name(account.Role)),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: _credentials);

        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

/// <summary>Claim names used in the access token.</summary>
public static class AppClaims
{
    public const string AccountId = "accountId";
    public const string Name = "name";
    public const string Role = "role";
    public const string Email = "email";
}
