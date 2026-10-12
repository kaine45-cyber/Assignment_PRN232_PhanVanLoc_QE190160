using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Common;
using TaskTrack.Service.Constants;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;
using TaskTrack.Service.Security;

namespace TaskTrack.Service.Services;

public class AuthService : IAuthService
{
    private const string InvalidCredentials = "Invalid email or password.";
    private const string InvalidRefreshToken = "Refresh token is invalid or has expired. Please log in again.";

    private readonly IAccountRepository _accounts;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;
    private readonly JwtSettings _settings;

    public AuthService(IAccountRepository accounts, IRefreshTokenRepository refreshTokens,
        IPasswordHasher hasher, ITokenService tokens, JwtSettings settings)
    {
        _accounts = accounts;
        _refreshTokens = refreshTokens;
        _hasher = hasher;
        _tokens = tokens;
        _settings = settings;
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    /// <summary>Always creates a STAFF account — the Admin role can only be seeded in the database.</summary>
    public async Task<AccountDto> RegisterAsync(RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (await _accounts.EmailExistsAsync(email))
            throw ConflictException.ForField("Email", "An account with this email already exists.");

        var account = new SystemAccount
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = _hasher.Hash(request.Password),
            Role = (short)AccountRole.Staff,
            CreatedDate = DateTime.Now
        };
        await _accounts.AddAsync(account);
        await _accounts.SaveChangesAsync();
        return account.ToDto(0);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var account = await _accounts.GetByEmailAsync(NormalizeEmail(request.Email));
        // Same message for "unknown email" and "wrong password" so emails cannot be enumerated.
        if (account == null || !_hasher.Verify(request.Password, account.PasswordHash))
            throw new UnauthorizedException(InvalidCredentials);

        return await IssueTokensAsync(account, previous: null);
    }

    /// <summary>Refresh-token rotation: each refresh token can be used once; reuse revokes the whole session family.</summary>
    public async Task<AuthResponse> RefreshAsync(string refreshToken)
    {
        var stored = await _refreshTokens.GetByHashAsync(RefreshTokenGenerator.Hash(refreshToken))
                     ?? throw new UnauthorizedException(InvalidRefreshToken);

        if (stored.RevokedAt != null)
        {
            // A rotated (already used) token was presented again → possible theft: revoke every active token.
            await RevokeAllAsync(stored.AccountId);
            throw new UnauthorizedException(InvalidRefreshToken);
        }
        if (stored.ExpiresAt <= DateTime.Now)
            throw new UnauthorizedException(InvalidRefreshToken);

        return await IssueTokensAsync(stored.Account, stored);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var stored = await _refreshTokens.GetByHashAsync(RefreshTokenGenerator.Hash(refreshToken));
        if (stored == null || stored.RevokedAt != null) return; // idempotent
        stored.RevokedAt = DateTime.Now;
        await _refreshTokens.SaveChangesAsync();
    }

    public async Task<AccountDto> GetProfileAsync(int accountId)
    {
        var row = await _accounts.GetWithTaskCountAsync(accountId)
                  ?? throw new NotFoundException("Account not found.");
        return row.Account.ToDto(row.CreatedTaskCount);
    }

    public async Task<AccountDto> UpdateProfileAsync(int accountId, UpdateProfileRequest request)
    {
        var account = await _accounts.GetByIdAsync(accountId) ?? throw new NotFoundException("Account not found.");
        account.FullName = request.FullName.Trim();
        await _accounts.SaveChangesAsync();
        return await GetProfileAsync(accountId);
    }

    /// <summary>Changes the password and signs out every session (all refresh tokens are revoked).</summary>
    public async Task ChangePasswordAsync(int accountId, ChangePasswordRequest request)
    {
        var account = await _accounts.GetByIdAsync(accountId) ?? throw new NotFoundException("Account not found.");
        if (!_hasher.Verify(request.CurrentPassword, account.PasswordHash))
            throw BadRequestException.ForField("CurrentPassword", "Current password is incorrect.");
        if (request.CurrentPassword == request.NewPassword)
            throw BadRequestException.ForField("NewPassword", "New password must be different from the current password.");

        account.PasswordHash = _hasher.Hash(request.NewPassword);
        await _accounts.SaveChangesAsync();
        await RevokeAllAsync(accountId);
    }

    private async Task<AuthResponse> IssueTokensAsync(SystemAccount account, RefreshToken? previous)
    {
        var access = _tokens.CreateAccessToken(account);
        var rawRefresh = RefreshTokenGenerator.NewToken();
        var refreshHash = RefreshTokenGenerator.Hash(rawRefresh);
        var refreshExpires = DateTime.Now.AddDays(_settings.RefreshTokenDays);

        if (previous != null)
        {
            previous.RevokedAt = DateTime.Now;
            previous.ReplacedByHash = refreshHash;
        }

        await _refreshTokens.AddAsync(new RefreshToken
        {
            AccountId = account.AccountId,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpires,
            CreatedAt = DateTime.Now
        });
        await _refreshTokens.SaveChangesAsync();

        var taskCount = await _accounts.CountCreatedTasksAsync(account.AccountId);
        return new AuthResponse
        {
            AccessToken = access.Token,
            ExpiresAt = access.ExpiresAt,
            RefreshToken = rawRefresh,
            RefreshTokenExpiresAt = refreshExpires,
            User = account.ToDto(taskCount)
        };
    }

    private async Task RevokeAllAsync(int accountId)
    {
        var active = await _refreshTokens.GetActiveForAccountAsync(accountId);
        foreach (var token in active) token.RevokedAt = DateTime.Now;
        await _refreshTokens.SaveChangesAsync();
    }
}
