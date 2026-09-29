using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class DepartmentRepository : GenericRepository<Department>, IDepartmentRepository
{
    public DepartmentRepository(TaskManagementContext context) : base(context) { }

    public async Task<List<Department>> GetDepartmentsAsync(bool includeInactive)
    {
        return await _context.Departments
            .AsNoTracking()
            .Include(d => d.Projects)
            .Where(d => includeInactive || d.IsActive)
            .OrderBy(d => d.DepartmentId)
            .ToListAsync();
    }

    public async Task<Department?> GetWithProjectsAsync(int id)
    {
        return await _context.Departments
            .AsNoTracking()
            .Include(d => d.Projects)
                .ThenInclude(p => p.Tasks)
            .FirstOrDefaultAsync(d => d.DepartmentId == id);
    }

    public async Task<List<Department>> SearchByNameAsync(string? name)
    {
        var query = _context.Departments.AsNoTracking().Include(d => d.Projects).Where(d => d.IsActive);
        if (!string.IsNullOrWhiteSpace(name))
        {
            var pattern = $"%{name.Trim()}%";
            query = query.Where(d => EF.Functions.ILike(d.DepartmentName, pattern));
        }
        return await query.OrderBy(d => d.DepartmentName).ToListAsync();
    }

    // Counts ALL projects (active or not) because the FK would still block a hard delete.
    public Task<bool> HasProjectsAsync(int id) =>
        _context.Projects.AnyAsync(p => p.DepartmentId == id);

    public Task<bool> ExistsAsync(int id) =>
        _context.Departments.AnyAsync(d => d.DepartmentId == id);
}
