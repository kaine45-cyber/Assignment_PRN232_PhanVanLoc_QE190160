using TaskTrack.Repo.Models;
using TaskTrack.Service.Constants;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Mappers;

public static class DtoMapper
{
    public static DepartmentDto ToDto(this Department d) => new()
    {
        DepartmentId = d.DepartmentId,
        DepartmentName = d.DepartmentName,
        DepartmentDescription = d.DepartmentDescription,
        IsActive = d.IsActive,
        ProjectCount = d.Projects.Count(p => p.IsActive)
    };

    public static DepartmentDetailDto ToDetailDto(this Department d) => new()
    {
        DepartmentId = d.DepartmentId,
        DepartmentName = d.DepartmentName,
        DepartmentDescription = d.DepartmentDescription,
        IsActive = d.IsActive,
        ProjectCount = d.Projects.Count(p => p.IsActive),
        Projects = d.Projects
            .Where(p => p.IsActive)
            .OrderBy(p => p.ProjectId)
            .Select(p => p.ToDto(d.DepartmentName))
            .ToList()
    };

    public static ProjectDto ToDto(this Project p, string? departmentName = null) => new()
    {
        ProjectId = p.ProjectId,
        ProjectName = p.ProjectName,
        Description = p.Description,
        StartDate = p.StartDate,
        EndDate = p.EndDate,
        Status = p.Status,
        StatusName = Labels.ProjectStatus(p.Status),
        DepartmentId = p.DepartmentId,
        DepartmentName = departmentName ?? p.Department?.DepartmentName ?? string.Empty,
        IsActive = p.IsActive,
        CreatedDate = p.CreatedDate,
        TaskCount = p.Tasks.Count(t => t.IsActive)
    };

    public static ProjectDetailDto ToDetailDto(this Project p)
    {
        var dto = new ProjectDetailDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Status = p.Status,
            StatusName = Labels.ProjectStatus(p.Status),
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.DepartmentName ?? string.Empty,
            IsActive = p.IsActive,
            CreatedDate = p.CreatedDate,
            TaskCount = p.Tasks.Count(t => t.IsActive),
            Tasks = p.Tasks
                .Where(t => t.IsActive)
                .OrderBy(t => t.TaskId)
                .Select(t => t.ToDto(p.ProjectName))
                .ToList()
        };
        return dto;
    }

    public static TaskDto ToDto(this TaskItem t, string? projectName = null) => new()
    {
        TaskId = t.TaskId,
        Title = t.Title,
        Description = t.Description,
        Status = t.Status,
        StatusName = Labels.TaskStatus(t.Status),
        Priority = t.Priority,
        PriorityName = Labels.TaskPriority(t.Priority),
        DueDate = t.DueDate,
        ProjectId = t.ProjectId,
        ProjectName = projectName ?? t.Project?.ProjectName ?? string.Empty,
        IsActive = t.IsActive,
        CreatedDate = t.CreatedDate,
        ModifiedDate = t.ModifiedDate,
        Tags = t.Tags.OrderBy(g => g.TagName).Select(g => g.ToDto(includeCount: false)).ToList()
    };

    public static TagDto ToDto(this Tag g, bool includeCount = true) => new()
    {
        TagId = g.TagId,
        TagName = g.TagName,
        Color = g.Color,
        TaskCount = includeCount ? g.Tasks.Count(t => t.IsActive) : 0
    };
}
