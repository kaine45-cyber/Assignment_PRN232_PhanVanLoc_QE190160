using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/projects")]
[Produces("application/json")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _service;

    public ProjectsController(IProjectService service) => _service = service;

    /// <summary>List all active projects with department name (includeInactive=true for the management page).</summary>
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll([FromQuery] bool includeInactive = false)
        => Ok(await _service.GetAllAsync(includeInactive));

    /// <summary>Get one project and its tasks.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDetailDto>> GetById(int id)
        => Ok(await _service.GetByIdAsync(id));

    [HttpGet("department/{departmentId:int}")]
    public async Task<ActionResult<List<ProjectDto>>> GetByDepartment(int departmentId)
        => Ok(await _service.GetByDepartmentAsync(departmentId));

    /// <summary>Filter projects — all parameters optional.</summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<ProjectDto>>> Search(
        [FromQuery] string? name, [FromQuery] short? status, [FromQuery] int? departmentId)
        => Ok(await _service.SearchAsync(name, status, departmentId));

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] ProjectRequest request)
    {
        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.ProjectId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProjectDto>> Update(int id, [FromBody] ProjectRequest request)
        => Ok(await _service.UpdateAsync(id, request));

    /// <summary>Delete a project — returns 400 if any task is linked.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
