using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface ITagRepository : IGenericRepository<Tag>
{
    Task<List<Tag>> GetAllWithUsageAsync();
    Task<Tag?> GetWithTasksAsync(int id);
    Task<List<Tag>> GetByIdsAsync(IEnumerable<int> ids);
    Task<bool> IsUsedAsync(int id);
    Task<bool> NameExistsAsync(string name, int? excludeId = null);
}
