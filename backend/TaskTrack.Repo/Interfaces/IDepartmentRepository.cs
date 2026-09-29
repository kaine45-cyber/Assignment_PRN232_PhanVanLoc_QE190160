using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface IDepartmentRepository : IGenericRepository<Department>
{
    Task<List<Department>> GetDepartmentsAsync(bool includeInactive);
    Task<Department?> GetWithProjectsAsync(int id);
    Task<List<Department>> SearchByNameAsync(string? name);
    Task<bool> HasProjectsAsync(int id);
    Task<bool> ExistsAsync(int id);
}
