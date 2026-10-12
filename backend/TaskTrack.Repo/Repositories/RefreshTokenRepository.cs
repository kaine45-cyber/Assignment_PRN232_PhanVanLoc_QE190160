using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class RefreshTokenRepository : GenericRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(TaskManagementContext context) : base(context) { }

    public Task<RefreshToken?> GetByHashAsync(string tokenHash) =>
        _context.RefreshTokens
            .Include(r => r.Account)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);

    public Task<List<RefreshToken>> GetActiveForAccountAsync(int accountId) =>
        _context.RefreshTokens
            .Where(r => r.AccountId == accountId && r.RevokedAt == null)
            .ToListAsync();
}
