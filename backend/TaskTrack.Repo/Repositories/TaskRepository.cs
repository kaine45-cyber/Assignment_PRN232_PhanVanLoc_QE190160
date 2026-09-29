using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class TaskRepository : GenericRepository<TaskItem>, ITaskRepository
{
    public TaskRepository(TaskManagementContext context) : base(context) { }

    private IQueryable<TaskItem> ReadQuery() =>
        _context.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
            .Include(t => t.Tags);

    public async Task<List<TaskItem>> GetActiveAsync()
    {
        return await ReadQuery()
            .Where(t => t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    /// <summary>Tracked query (used for update / soft-delete, tags are replaced in place).</summary>
    public async Task<TaskItem?> GetWithDetailsAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.TaskId == id);
    }

    public async Task<List<TaskItem>> GetByProjectAsync(int projectId)
    {
        return await ReadQuery()
            .Where(t => t.ProjectId == projectId && t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    public async Task<List<TaskItem>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var query = ReadQuery().Where(t => t.IsActive);

        if (!string.IsNullOrWhiteSpace(title))
        {
            var pattern = $"%{title.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.Title, pattern));
        }
        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);
        if (priority.HasValue)
            query = query.Where(t => t.Priority == priority.Value);
        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);
        if (tagId.HasValue)
            query = query.Where(t => t.Tags.Any(g => g.TagId == tagId.Value));

        return await query.OrderBy(t => t.TaskId).ToListAsync();
    }

    public Task<int> CountActiveAsync() => _context.Tasks.CountAsync(t => t.IsActive);
}
