using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Interfaces;

public interface ITaskRepository : IGenericRepository<TaskItem>
{
    Task<List<TaskItem>> GetActiveAsync();
    Task<TaskItem?> GetWithDetailsAsync(int id);
    Task<List<TaskItem>> GetByProjectAsync(int projectId);
    Task<List<TaskItem>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId);
    Task<int> CountActiveAsync();
}
