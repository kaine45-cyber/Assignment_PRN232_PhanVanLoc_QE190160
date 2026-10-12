using TaskTrack.Repo.Models;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

/// <summary>Creates signed JWT access tokens. Implemented in the API layer (JWT library + secret live there).</summary>
public interface ITokenService
{
    AccessToken CreateAccessToken(SystemAccount account);
}

public interface IAuthService
{
    Task<AccountDto> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<AccountDto> GetProfileAsync(int accountId);
    Task<AccountDto> UpdateProfileAsync(int accountId, UpdateProfileRequest request);
    Task ChangePasswordAsync(int accountId, ChangePasswordRequest request);
}

public interface IAccountService
{
    Task<List<AccountDto>> GetAllAsync();
    Task<AccountDto> GetByIdAsync(int id);
    Task<AccountDto> UpdateAsync(int id, UpdateAccountRequest request, int actorId);
    Task DeleteAsync(int id, int actorId);
}
