using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class TagRepository : GenericRepository<Tag>, ITagRepository
{
    public TagRepository(TaskManagementContext context) : base(context) { }

    public async Task<List<Tag>> GetAllWithUsageAsync()
    {
        return await _context.Tags
            .AsNoTracking()
            .Include(t => t.Tasks)
            .OrderBy(t => t.TagName)
            .ToListAsync();
    }

    public Task<Tag?> GetWithTasksAsync(int id) =>
        _context.Tags.Include(t => t.Tasks).FirstOrDefaultAsync(t => t.TagId == id);

    public async Task<List<Tag>> GetByIdsAsync(IEnumerable<int> ids)
    {
        var idList = ids.Distinct().ToList();
        return await _context.Tags.Where(t => idList.Contains(t.TagId)).ToListAsync();
    }

    // Any link in TaskTag (including soft-deleted tasks) blocks deletion because of the FK.
    public Task<bool> IsUsedAsync(int id) =>
        _context.Tasks.AnyAsync(t => t.Tags.Any(g => g.TagId == id));

    public Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var lowered = name.Trim().ToLower();
        return _context.Tags.AnyAsync(t => t.TagName.ToLower() == lowered
                                           && (excludeId == null || t.TagId != excludeId));
    }
}
