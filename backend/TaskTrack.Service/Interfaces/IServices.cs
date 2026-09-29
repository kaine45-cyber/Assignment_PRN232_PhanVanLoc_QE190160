using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Interfaces;

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetAllAsync(bool includeInactive = false);
    Task<DepartmentDetailDto> GetByIdAsync(int id);
    Task<List<DepartmentDto>> SearchAsync(string? name);
    Task<DepartmentDto> CreateAsync(DepartmentRequest request);
    Task<DepartmentDto> UpdateAsync(int id, DepartmentRequest request);
    Task DeleteAsync(int id);
}

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllAsync(bool includeInactive = false);
    Task<ProjectDetailDto> GetByIdAsync(int id);
    Task<List<ProjectDto>> GetByDepartmentAsync(int departmentId);
    Task<List<ProjectDto>> SearchAsync(string? name, short? status, int? departmentId);
    Task<ProjectDto> CreateAsync(ProjectRequest request);
    Task<ProjectDto> UpdateAsync(int id, ProjectRequest request);
    Task DeleteAsync(int id);
}

public interface ITaskService
{
    Task<List<TaskDto>> GetAllAsync();
    Task<TaskDto> GetByIdAsync(int id);
    Task<List<TaskDto>> GetByProjectAsync(int projectId);
    Task<List<TaskDto>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId);
    Task<TaskDto> CreateAsync(TaskRequest request);
    Task<TaskDto> UpdateAsync(int id, TaskRequest request);
    Task SoftDeleteAsync(int id);
}

public interface ITagService
{
    Task<List<TagDto>> GetAllAsync();
    Task<TagDto> CreateAsync(TagRequest request);
    Task<TagDto> UpdateAsync(int id, TagRequest request);
    Task DeleteAsync(int id);
}
