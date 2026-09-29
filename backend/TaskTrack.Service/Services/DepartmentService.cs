using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Common;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;

namespace TaskTrack.Service.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _departments;

    public DepartmentService(IDepartmentRepository departments)
    {
        _departments = departments;
    }

    public async Task<List<DepartmentDto>> GetAllAsync(bool includeInactive = false)
    {
        var list = await _departments.GetDepartmentsAsync(includeInactive);
        return list.Select(d => d.ToDto()).ToList();
    }

    public async Task<DepartmentDetailDto> GetByIdAsync(int id)
    {
        var department = await _departments.GetWithProjectsAsync(id)
                         ?? throw new NotFoundException($"Department {id} not found.");
        return department.ToDetailDto();
    }

    public async Task<List<DepartmentDto>> SearchAsync(string? name)
    {
        var list = await _departments.SearchByNameAsync(name);
        return list.Select(d => d.ToDto()).ToList();
    }

    public async Task<DepartmentDto> CreateAsync(DepartmentRequest request)
    {
        var department = new Department
        {
            DepartmentName = request.DepartmentName.Trim(),
            DepartmentDescription = request.DepartmentDescription.Trim(),
            IsActive = request.IsActive
        };
        await _departments.AddAsync(department);
        await _departments.SaveChangesAsync();
        return department.ToDto();
    }

    public async Task<DepartmentDto> UpdateAsync(int id, DepartmentRequest request)
    {
        var department = await _departments.GetByIdAsync(id)
                         ?? throw new NotFoundException($"Department {id} not found.");

        department.DepartmentName = request.DepartmentName.Trim();
        department.DepartmentDescription = request.DepartmentDescription.Trim();
        department.IsActive = request.IsActive;

        await _departments.SaveChangesAsync();
        return (await _departments.GetWithProjectsAsync(id))!.ToDto();
    }

    public async Task DeleteAsync(int id)
    {
        var department = await _departments.GetByIdAsync(id)
                         ?? throw new NotFoundException($"Department {id} not found.");

        if (await _departments.HasProjectsAsync(id))
            throw new BadRequestException("Cannot delete this department because it still has projects linked to it.");

        _departments.Remove(department);
        await _departments.SaveChangesAsync();
    }
}
