using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface IRefreshTokenRepository : IGenericRepository<RefreshToken>
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash);
    Task<List<RefreshToken>> GetActiveForAccountAsync(int accountId);
}
