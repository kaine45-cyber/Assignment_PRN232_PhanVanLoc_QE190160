using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface IProjectRepository : IGenericRepository<Project>
{
    Task<List<Project>> GetProjectsAsync(bool includeInactive);
    Task<Project?> GetWithDepartmentAsync(int id);
    Task<Project?> GetWithTasksAsync(int id);
    Task<List<Project>> GetByDepartmentAsync(int departmentId);
    Task<List<Project>> SearchAsync(string? name, short? status, int? departmentId);
    Task<bool> HasTasksAsync(int id);
    Task<bool> ExistsAsync(int id);
}
