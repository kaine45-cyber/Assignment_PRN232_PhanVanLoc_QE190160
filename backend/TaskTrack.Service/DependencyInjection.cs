using Microsoft.Extensions.DependencyInjection;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Services;

namespace TaskTrack.Service;

public static class DependencyInjection
{
    /// <summary>Registers repositories and services (the API layer only knows this entry point).</summary>
    public static IServiceCollection AddTaskTrackServices(this IServiceCollection services)
    {
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<ITagRepository, TagRepository>();

        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITagService, TagService>();
        return services;
    }
}
