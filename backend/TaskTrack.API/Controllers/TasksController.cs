using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Produces("application/json")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _service;

    public TasksController(ITaskService service) => _service = service;

    /// <summary>List all active tasks.</summary>
    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    /// <summary>Get one task including its tags.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDto>> GetById(int id)
        => Ok(await _service.GetByIdAsync(id));

    [HttpGet("project/{projectId:int}")]
    public async Task<ActionResult<List<TaskDto>>> GetByProject(int projectId)
        => Ok(await _service.GetByProjectAsync(projectId));

    /// <summary>Filter tasks — all parameters optional.</summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<TaskDto>>> Search(
        [FromQuery] string? title, [FromQuery] short? status, [FromQuery] short? priority,
        [FromQuery] int? projectId, [FromQuery] int? tagId)
        => Ok(await _service.SearchAsync(title, status, priority, projectId, tagId));

    /// <summary>Create a task (optional TagIds array).</summary>
    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create([FromBody] TaskRequest request)
    {
        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.TaskId }, created);
    }

    /// <summary>Update a task, replace its tags and set ModifiedDate = now.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDto>> Update(int id, [FromBody] TaskRequest request)
        => Ok(await _service.UpdateAsync(id, request));

    /// <summary>Soft-delete: sets IsActive = false (never hard-deletes).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.SoftDeleteAsync(id);
        return NoContent();
    }
}
