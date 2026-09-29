using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Common;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;

namespace TaskTrack.Service.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projects;
    private readonly IDepartmentRepository _departments;

    public ProjectService(IProjectRepository projects, IDepartmentRepository departments)
    {
        _projects = projects;
        _departments = departments;
    }

    public async Task<List<ProjectDto>> GetAllAsync(bool includeInactive = false)
    {
        var list = await _projects.GetProjectsAsync(includeInactive);
        return list.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProjectDetailDto> GetByIdAsync(int id)
    {
        var project = await _projects.GetWithTasksAsync(id)
                      ?? throw new NotFoundException($"Project {id} not found.");
        return project.ToDetailDto();
    }

    public async Task<List<ProjectDto>> GetByDepartmentAsync(int departmentId)
    {
        if (!await _departments.ExistsAsync(departmentId))
            throw new NotFoundException($"Department {departmentId} not found.");

        var list = await _projects.GetByDepartmentAsync(departmentId);
        return list.Select(p => p.ToDto()).ToList();
    }

    public async Task<List<ProjectDto>> SearchAsync(string? name, short? status, int? departmentId)
    {
        var list = await _projects.SearchAsync(name, status, departmentId);
        return list.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProjectDto> CreateAsync(ProjectRequest request)
    {
        await EnsureDepartmentExists(request.DepartmentId!.Value);

        var project = new Project
        {
            ProjectName = request.ProjectName.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            StartDate = request.StartDate!.Value,
            EndDate = request.EndDate,
            Status = request.Status,
            DepartmentId = request.DepartmentId.Value,
            IsActive = request.IsActive,
            CreatedDate = DateTime.Now
        };

        await _projects.AddAsync(project);
        await _projects.SaveChangesAsync();
        return (await _projects.GetWithDepartmentAsync(project.ProjectId))!.ToDto();
    }

    public async Task<ProjectDto> UpdateAsync(int id, ProjectRequest request)
    {
        var project = await _projects.GetByIdAsync(id)
                      ?? throw new NotFoundException($"Project {id} not found.");

        await EnsureDepartmentExists(request.DepartmentId!.Value);

        project.ProjectName = request.ProjectName.Trim();
        project.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        project.StartDate = request.StartDate!.Value;
        project.EndDate = request.EndDate;
        project.Status = request.Status;
        project.DepartmentId = request.DepartmentId.Value;
        project.IsActive = request.IsActive;

        await _projects.SaveChangesAsync();
        return (await _projects.GetWithDepartmentAsync(id))!.ToDto();
    }

    public async Task DeleteAsync(int id)
    {
        var project = await _projects.GetByIdAsync(id)
                      ?? throw new NotFoundException($"Project {id} not found.");

        if (await _projects.HasTasksAsync(id))
            throw new BadRequestException("Cannot delete this project because it still has tasks linked to it.");

        _projects.Remove(project);
        await _projects.SaveChangesAsync();
    }

    private async Task EnsureDepartmentExists(int departmentId)
    {
        if (!await _departments.ExistsAsync(departmentId))
            throw BadRequestException.ForField("DepartmentId", $"Department {departmentId} does not exist.");
    }
}
