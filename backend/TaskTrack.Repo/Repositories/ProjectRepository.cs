using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class ProjectRepository : GenericRepository<Project>, IProjectRepository
{
    public ProjectRepository(TaskManagementContext context) : base(context) { }

    private IQueryable<Project> BaseQuery() =>
        _context.Projects
            .AsNoTracking()
            .Include(p => p.Department)
            .Include(p => p.Tasks);

    public async Task<List<Project>> GetProjectsAsync(bool includeInactive)
    {
        return await BaseQuery()
            .Where(p => includeInactive || p.IsActive)
            .OrderBy(p => p.ProjectId)
            .ToListAsync();
    }

    public Task<Project?> GetWithDepartmentAsync(int id) =>
        BaseQuery().FirstOrDefaultAsync(p => p.ProjectId == id);

    public async Task<Project?> GetWithTasksAsync(int id)
    {
        return await _context.Projects
            .AsNoTracking()
            .Include(p => p.Department)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.Tags)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
    }

    public async Task<List<Project>> GetByDepartmentAsync(int departmentId)
    {
        return await BaseQuery()
            .Where(p => p.DepartmentId == departmentId && p.IsActive)
            .OrderBy(p => p.ProjectId)
            .ToListAsync();
    }

    public async Task<List<Project>> SearchAsync(string? name, short? status, int? departmentId)
    {
        var query = BaseQuery().Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(name))
        {
            var pattern = $"%{name.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.ProjectName, pattern));
        }
        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);
        if (departmentId.HasValue)
            query = query.Where(p => p.DepartmentId == departmentId.Value);

        return await query.OrderBy(p => p.ProjectName).ToListAsync();
    }

    // Counts ALL tasks (including soft-deleted) because the FK would still block a hard delete.
    public Task<bool> HasTasksAsync(int id) =>
        _context.Tasks.AnyAsync(t => t.ProjectId == id);

    public Task<bool> ExistsAsync(int id) =>
        _context.Projects.AnyAsync(p => p.ProjectId == id);
}
