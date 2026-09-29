using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Common;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;

namespace TaskTrack.Service.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _tasks;
    private readonly IProjectRepository _projects;
    private readonly ITagRepository _tags;

    public TaskService(ITaskRepository tasks, IProjectRepository projects, ITagRepository tags)
    {
        _tasks = tasks;
        _projects = projects;
        _tags = tags;
    }

    public async Task<List<TaskDto>> GetAllAsync()
    {
        var list = await _tasks.GetActiveAsync();
        return list.Select(t => t.ToDto()).ToList();
    }

    public async Task<TaskDto> GetByIdAsync(int id)
    {
        var task = await _tasks.GetWithDetailsAsync(id);
        if (task == null || !task.IsActive)
            throw new NotFoundException($"Task {id} not found.");
        return task.ToDto();
    }

    public async Task<List<TaskDto>> GetByProjectAsync(int projectId)
    {
        if (!await _projects.ExistsAsync(projectId))
            throw new NotFoundException($"Project {projectId} not found.");

        var list = await _tasks.GetByProjectAsync(projectId);
        return list.Select(t => t.ToDto()).ToList();
    }

    public async Task<List<TaskDto>> SearchAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var list = await _tasks.SearchAsync(title, status, priority, projectId, tagId);
        return list.Select(t => t.ToDto()).ToList();
    }

    public async Task<TaskDto> CreateAsync(TaskRequest request)
    {
        await EnsureProjectExists(request.ProjectId!.Value);
        var tags = await ResolveTags(request.TagIds);

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Status = request.Status,
            Priority = request.Priority,
            DueDate = request.DueDate,
            ProjectId = request.ProjectId.Value,
            IsActive = true,
            CreatedDate = DateTime.Now
        };
        foreach (var tag in tags) task.Tags.Add(tag);

        await _tasks.AddAsync(task);
        await _tasks.SaveChangesAsync();
        return await GetByIdAsync(task.TaskId);
    }

    public async Task<TaskDto> UpdateAsync(int id, TaskRequest request)
    {
        var task = await _tasks.GetWithDetailsAsync(id);
        if (task == null || !task.IsActive)
            throw new NotFoundException($"Task {id} not found.");

        await EnsureProjectExists(request.ProjectId!.Value);
        var tags = await ResolveTags(request.TagIds);

        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.DueDate = request.DueDate;
        task.ProjectId = request.ProjectId.Value;
        task.ModifiedDate = DateTime.Now;

        // Replace tags: remove all existing TaskTag rows, then add the new set.
        task.Tags.Clear();
        foreach (var tag in tags) task.Tags.Add(tag);

        await _tasks.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task SoftDeleteAsync(int id)
    {
        var task = await _tasks.GetWithDetailsAsync(id);
        if (task == null || !task.IsActive)
            throw new NotFoundException($"Task {id} not found.");

        task.IsActive = false;          // soft delete — never hard-delete tasks
        task.ModifiedDate = DateTime.Now;
        await _tasks.SaveChangesAsync();
    }

    private async Task EnsureProjectExists(int projectId)
    {
        if (!await _projects.ExistsAsync(projectId))
            throw BadRequestException.ForField("ProjectId", $"Project {projectId} does not exist.");
    }

    private async Task<List<Tag>> ResolveTags(List<int>? tagIds)
    {
        if (tagIds == null || tagIds.Count == 0) return new List<Tag>();

        var distinct = tagIds.Distinct().ToList();
        var tags = await _tags.GetByIdsAsync(distinct);
        var missing = distinct.Except(tags.Select(t => t.TagId)).ToList();
        if (missing.Count > 0)
            throw BadRequestException.ForField("TagIds", $"Tag(s) not found: {string.Join(", ", missing)}.");
        return tags;
    }
}
