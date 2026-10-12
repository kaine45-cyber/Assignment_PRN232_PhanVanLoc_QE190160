using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface IAccountRepository : IGenericRepository<SystemAccount>
{
    /// <summary>Accounts with the number of tasks each one created (soft-deleted tasks included).</summary>
    Task<List<(SystemAccount Account, int CreatedTaskCount)>> GetAllWithTaskCountAsync();
    Task<(SystemAccount Account, int CreatedTaskCount)?> GetWithTaskCountAsync(int id);
    Task<SystemAccount?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task<int> CountCreatedTasksAsync(int accountId);
    Task<int> CountAdminsAsync();
}
