using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class AccountRepository : GenericRepository<SystemAccount>, IAccountRepository
{
    public AccountRepository(TaskManagementContext context) : base(context) { }

    public async Task<List<(SystemAccount Account, int CreatedTaskCount)>> GetAllWithTaskCountAsync()
    {
        var rows = await _context.SystemAccounts
            .AsNoTracking()
            .OrderBy(a => a.AccountId)
            .Select(a => new { Account = a, Count = a.CreatedTasks.Count() })
            .ToListAsync();
        return rows.Select(r => (r.Account, r.Count)).ToList();
    }

    public async Task<(SystemAccount Account, int CreatedTaskCount)?> GetWithTaskCountAsync(int id)
    {
        var row = await _context.SystemAccounts
            .AsNoTracking()
            .Where(a => a.AccountId == id)
            .Select(a => new { Account = a, Count = a.CreatedTasks.Count() })
            .FirstOrDefaultAsync();
        return row == null ? null : (row.Account, row.Count);
    }

    // Emails are stored lower-cased by the service layer.
    public Task<SystemAccount?> GetByEmailAsync(string email) =>
        _context.SystemAccounts.FirstOrDefaultAsync(a => a.Email == email);

    public Task<bool> EmailExistsAsync(string email) =>
        _context.SystemAccounts.AnyAsync(a => a.Email == email);

    // Counts ALL tasks (including soft-deleted ones) because the FK still references the account.
    public Task<int> CountCreatedTasksAsync(int accountId) =>
        _context.Tasks.CountAsync(t => t.CreatedById == accountId);

    public Task<int> CountAdminsAsync() =>
        _context.SystemAccounts.CountAsync(a => a.Role == 1);
}
